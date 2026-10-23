import { createHash } from 'node:crypto';
import { verifyListing } from './verify.js';
import { pollFeed, pollHackerNews } from './feeds.js';
import { Source, SearchProfile, type Reader } from './contracts.js';
import { pollSource, sourceFromUrl } from './adapters.js';
import { extractJobPosting, permittedPage, discoverLinks } from './crawler.js';
import { DiscoveryStore } from './store.js';
import { bm25, reciprocalRankFusion } from './ranking.js';
import { assess, expandRoles } from './matching.js';
export class DiscoveryEngine {
  constructor(
    readonly store: DiscoveryStore,
    readonly read: Reader,
  ) {}
  async poll(id: string, maxPages = 20) {
    const claim = this.store.claim(id);
    if (!claim) return { sourceId: id, status: 'busy_or_disabled' };
    try {
      const poll =
        claim.source.provider === 'feed'
          ? await pollFeed(claim.source, this.read)
          : claim.source.provider === 'hackernews'
            ? await pollHackerNews(claim.source, this.read)
            : claim.source.provider === 'page'
              ? extractJobPosting(
                  await permittedPage(this.read, claim.source.url!),
                  claim.source.url!,
                  claim.source,
                  new Date().toISOString(),
                )
              : await pollSource(claim.source, this.read, { maxPages });
      this.store.commit(claim, poll);
      return {
        sourceId: id,
        status: poll.complete ? 'complete' : 'partial',
        count: poll.jobs.length,
        diagnostics: poll.diagnostics,
      };
    } catch (e) {
      const code = e instanceof Error ? e.message : 'source_failed';
      const safe = /^[a-z_\d]+$/.test(code) ? code : 'source_failed';
      this.store.fail(claim, safe);
      return { sourceId: id, status: 'failed', error: safe };
    }
  }
  async due(stopped = () => false) {
    const now = new Date().toISOString();
    const results = [];
    for (const s of this.store.sources())
      if (!stopped() && s.config.enabled && s.next_poll <= now) results.push(await this.poll(s.id));
    return results;
  }
  // A search key is optional and only leaves the device in this dedicated provider request.
  async discover(profileInput: unknown, braveKey?: string, budget = 6) {
    const profile = SearchProfile.parse(profileInput);
    budget = Number.isFinite(budget) ? Math.max(0, Math.min(6, Math.floor(budget))) : 6;
    const queries = [...new Set([...profile.roles, ...expandRoles(profile.roles)])].slice(
      0,
      budget,
    );
    let added = 0;
    for (const q of queries) {
      const id = `himalayas:${q.toLowerCase()}:any`;
      if (!this.store.sources().some((s) => s.id === id))
        this.store.addSource({
          id,
          provider: 'himalayas',
          query: q,
          company: 'Himalayas',
          intervalMinutes: 1440,
        });
    }
    if (!braveKey)
      return {
        searchQueries: 0,
        automaticBoardCandidates: 0,
        jobBoardQueries: queries.length,
        notice:
          'Optional BRAVE_SEARCH_API_KEY enables indexed employer/board discovery. Configured public sources run without it.',
      };
    const indexedQueries = queries
      .slice(0, Math.ceil(budget / 2))
      .flatMap((role) => [
        {
          role,
          query: `(${role}) (jobs OR careers OR hiring) (site:jobs.ashbyhq.com OR site:jobs.lever.co OR site:job-boards.greenhouse.io OR site:apply.workable.com)`,
        },
        { role, query: `(${role}) (careers OR \"we are hiring\" OR \"join our team\")` },
      ])
      .slice(0, budget);
    for (const { role, query } of indexedQueries) {
      const url = new URL('https://api.search.brave.com/res/v1/web/search');
      url.searchParams.set('q', query);
      url.searchParams.set('country', 'ALL');
      url.searchParams.set('count', '20');
      const result = await this.read(url.toString(), {
        headers: { 'X-Subscription-Token': braveKey },
      });
      if (result.status !== 200) throw new Error(`search_http_${result.status}`);
      const data = JSON.parse(result.body);
      for (const r of data.web?.results ?? []) {
        if (typeof r.url !== 'string') continue;
        try {
          this.store.addFrontier(r.url, `brave:${role}`);
          const s = sourceFromUrl(r.url);
          if (s && !this.store.sources().some((x) => x.id === s.id)) {
            this.store.addSource(s);
            added++;
          }
        } catch {}
      }
    }
    return {
      searchQueries: indexedQueries.length,
      automaticBoardCandidates: added,
      jobBoardQueries: queries.length,
    };
  }
  async crawl(seed: string, maxPages = 5) {
    const pending = [seed];
    const seen = new Set<string>();
    let jobs = 0,
      boards = 0;
    while (pending.length && seen.size < maxPages) {
      const url = pending.shift()!;
      if (seen.has(url)) continue;
      seen.add(url);
      this.store.addFrontier(url, seed);
      const html = await permittedPage(this.read, url);
      const source = Source.parse({
        id: `page:${createHash('sha256').update(url).digest('hex')}`,
        provider: 'page',
        url,
        company: new URL(url).hostname,
        intervalMinutes: 1440,
      });
      if (!this.store.sources().some((s) => s.id === source.id)) this.store.addSource(source);
      const claim = this.store.claim(source.id);
      if (claim) {
        try {
          const result = extractJobPosting(html, url, source, new Date().toISOString());
          this.store.commit(claim, result);
          jobs += result.jobs.length;
        } catch {
          this.store.fail(claim, 'page_parse_failed');
        }
      }
      for (const link of discoverLinks(html, url)) {
        this.store.addFrontier(link.url, url);
        if (link.source) {
          if (!this.store.sources().some((s) => s.id === link.source!.id)) {
            this.store.addSource(link.source);
            boards++;
          }
        } else if (new URL(link.url).origin === new URL(seed).origin && !seen.has(link.url))
          pending.push(link.url);
      }
    }
    return { pages: seen.size, jobs, boardCandidates: boards, remaining: pending.length };
  }
  async hunt(
    profileInput: unknown,
    braveKey?: string,
    options: { maxSources?: number; maxPages?: number } = {},
  ) {
    const discovery = await this.discover(profileInput, braveKey);
    const due = this.store
      .sources()
      .filter((s) => s.config.enabled && s.next_poll <= new Date().toISOString());
    const results = [];
    for (const source of due.slice(0, options.maxSources ?? 20))
      results.push(await this.poll(source.id, options.maxPages ?? 5));
    return {
      discovery,
      runs: results,
      deferredSources: Math.max(0, due.length - (options.maxSources ?? 20)),
      matches: this.matches(profileInput),
    };
  }
  async verify(id: string) {
    const row = this.store.findJob(id);
    if (!row) throw new Error('job_not_found');
    const source = this.store.sources().find((s) => s.id === row.job.sourceId)?.config;
    if (!source || !source.enabled) throw new Error('source_disabled_or_missing');
    const result = await verifyListing(source, row.job, this.read);
    if (!this.store.recordVerification(id, row.canonicalUrl, result.verification, result.job))
      return {
        ...result.verification,
        status: 'unknown',
        reason: 'Posting changed during verification; recheck the current version.',
      };
    return result.verification;
  }
  matches(profileInput: unknown, limit = 300) {
    const profile = SearchProfile.parse(profileInput);
    // Keep every source observation in storage, but rank a canonical vacancy only once.
    const clusters = new Map<string, any[]>();
    for (const row of this.store.jobs({ limit: 5000 })) {
      const key = row.duplicateCluster;
      clusters.set(key, [...(clusters.get(key) ?? []), row]);
    }
    const rows = [...clusters.values()].map((observations) => {
      const preferred = [...observations].sort(
        (a, b) =>
          Number(a.job.provider === 'himalayas') - Number(b.job.provider === 'himalayas') ||
          b.lastSeen.localeCompare(a.lastSeen),
      )[0]!;
      return {
        ...preferred,
        sourceObservations: observations.map((r) => ({
          id: r.id,
          sourceId: r.job.sourceId,
          url: r.job.sourceUrl,
        })),
        assessment: assess(preferred.job, profile),
      };
    });
    const lexical = bm25(
      rows.map((row) => ({
        id: row.id,
        text: `${row.job.title} ${row.job.title} ${row.job.description}`,
      })),
      [...expandRoles(profile.roles), ...profile.skills.map((s) => s.name)].join(' '),
    );
    const byLexical = [...rows]
      .filter((r) => (lexical.get(r.id) ?? 0) > 0)
      .sort((a, b) => (lexical.get(b.id) ?? 0) - (lexical.get(a.id) ?? 0))
      .map((r) => r.id);
    const byEvidence = [...rows]
      .filter((r) => r.assessment.fitEvidence.length > 0 || r.assessment.fitScore >= 30)
      .sort((a, b) => b.assessment.fitScore - a.assessment.fitScore)
      .map((r) => r.id);
    const fusion = reciprocalRankFusion([byLexical, byEvidence]);
    return rows
      .map((row) => ({
        ...row,
        lexicalScore: lexical.get(row.id) ?? 0,
        retrievalScore: fusion.get(row.id) ?? 0,
      }))
      .filter((row) => row.retrievalScore > 0)
      .sort(
        (a, b) =>
          Number(a.assessment.eligibility === 'ineligible') -
            Number(b.assessment.eligibility === 'ineligible') ||
          b.retrievalScore - a.retrievalScore ||
          a.id.localeCompare(b.id),
      )
      .slice(0, limit);
  }
}
