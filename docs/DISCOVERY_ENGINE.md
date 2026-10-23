# Opportunity discovery engine

Implemented 2026-10-23. This is a working headless sourcing service and an importer for the retained API. It is **not yet connected to the native desktop harness**, and it does not make applications. The native runtime currently denies agent tools; adding a library does not change that boundary.

## Why discovery is a separate service

Searching, fetching structured jobs, removing duplicates and checking unchanged listings should not require an LLM. A bounded discovery run collects source evidence, then ranks candidates. Resume tailoring and deeper company research can consume a separate model budget after selection.

The engine runs locally with SQLite and no Pursuit account. It can run on a user-owned server with Node and persistent storage. That is a headless worker, not the finished encrypted companion transport or desktop worker-management experience.

```text
Role preferences → query expansion → public job search / optional indexed search
                                       ↓
Configured employer boards ← discovered ATS board links
          ↓
Fetch → normalize → source snapshots → freshness → canonical-URL grouping
          ↓
Eligibility constraints → BM25 + evidence ranking → explained shortlist

RSS / Atom / hiring-thread posts → unverified leads → investigate employer vacancy
```

## Run it

Use Node 24 LTS, or Node >=22.13 with built-in SQLite support. These commands run from the repository root after `pnpm install`.

```sh
pnpm --filter @pursuit/discovery build
pnpm discovery sources
pnpm discovery hunt packages/discovery/examples/profile.json
pnpm discovery matches packages/discovery/examples/profile.json
pnpm discovery jobs
pnpm discovery runs
```

The example profile is synthetic. Replace its skills and evidence references with your own, and confirm your residence before marking it verified. Roles are searched globally; a search result is not proof you can work in that country.

`hunt` registers up to six role queries, polls up to 20 due sources with at most five pages per paginated source, then returns up to 300 ranked canonical candidates. It starts without a known employer board or model key using Himalayas search. This initial source mainly covers remote roles; it is not the whole global labour market. Role aliases cover eight initial families and preserve custom role names. Broader multilingual occupation coverage remains work.

Database default: `~/.pursuit/discovery.sqlite`. Set `PURSUIT_DISCOVERY_DB` to an isolated path for experiments or a persistent volume on your server. The engine creates a private directory and sets the database file to mode 0600. SQLite data is not encrypted at rest.

### Add employer boards and watchers

```sh
pnpm discovery add packages/discovery/examples/source.json
pnpm discovery poll greenhouse:cloudflare
pnpm discovery watch
pnpm discovery disable greenhouse:cloudflare
pnpm discovery enable greenhouse:cloudflare
```

`watch` polls due sources, sleeps between checks and stops on SIGINT/SIGTERM. A source interval defaults to six hours, can be set between 15 minutes and seven days, and does not override a provider's access conditions. Search sources created by `hunt` default to daily checks. Failed runs back off, starting at 30 minutes and capped at a day. There are no model calls in this process.

Additional source configurations:

```json
{"id":"ashby:linear","provider":"ashby","board":"linear","company":"Linear"}
{"id":"lever:spotify","provider":"lever","board":"spotify","region":"us","company":"Spotify"}
{"id":"feed:wwr","provider":"feed","url":"https://weworkremotely.com/remote-jobs.rss","company":"We Work Remotely"}
{"id":"community:hn","provider":"hackernews","company":"Hacker News hiring thread"}
```

Save each object as a separate JSON file and pass it to `add`. Lever EU boards use `region: "eu"`. Hacker News accepts an optional `board` containing a Who Is Hiring thread ID; otherwise it searches the official `whoishiring` user's recent submissions. Feed and thread items remain leads, with no verified application route.

### Discover employer sources

An optional `BRAVE_SEARCH_API_KEY` enables up to six indexed queries per discovery run. These combine ATS-domain queries and general career/hiring queries with country targeting `ALL`. Requests may incur your provider's charges. Only role text is sent, not your resume or candidate evidence. The key stays in the search-provider request header.

```sh
pnpm discovery discover packages/discovery/examples/profile.json
pnpm discovery frontier
pnpm discovery crawl https://example.com/careers
```

Supported ATS URLs found by search register board candidates for subsequent polling. Other URLs are retained in the frontier for investigation; they are **not automatically crawled or called verified vacancies**. `crawl` walks at most five same-origin career/job pages, follows supported ATS links, respects robots rules and extracts static JobPosting JSON-LD. A JavaScript-only page is not automatically rendered. Check site access conditions before configuring sources; robots permission alone is not a redistribution licence.

### Verify a listing

```sh
pnpm discovery verify JOB_ID
```

Use an ID from `jobs` or `matches`. Verification is recorded separately. A current structured posting becomes `observed_open`, not “actively interviewing.” Greenhouse and Lever use individual-posting endpoints; Himalayas uses its job-status route. Himalayas 410 means closed; 404 remains unknown. A 200 page without matching JobPosting evidence remains unknown. A hiring lead stays unverified. Verification is not an automatic application authorization.

## Implemented source coverage

| Route          | Implemented behavior                                                           | Verification evidence                                |
| -------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------- |
| Greenhouse     | Public board, all returned jobs; individual posting checks                     | Fixtures plus live Cloudflare board: 446 records     |
| Ashby          | Public listed jobs, including compensation where provided                      | Fixtures plus live Linear board: 34 records          |
| Lever          | US/EU host selection, offset pagination, repeated-page detection               | Fixtures plus live Spotify board: 80 records         |
| Workable       | Public account jobs, normalized listing evidence                               | Fixture tested; no live contract check in this run   |
| Himalayas      | Keyless search, paginated query, explicit country/timezone data, status checks | Fixtures plus live one-page search: 20 records       |
| Employer pages | Robots checks, static JobPosting JSON-LD, employer/ATS link discovery          | Controlled fixtures; no general browser extraction   |
| RSS / Atom     | Windowed public feed, original URL/date, lead classification                   | Fixtures plus live WWR feed: 93 leads                |
| Hacker News    | Official API, actual Who Is Hiring threads, bounded comment reads              | Fixtures; no live check in this run                  |
| Brave          | Optional bounded indexed search and source frontier                            | Contract mocked; no configured key/live search check |

Counts are observations from 2026-10-23, not coverage promises or guaranteed available openings. Himalayas attribution is retained, and its application link is preserved unchanged. Its `pubDate` is treated as an update time rather than invented original publication time.

LinkedIn, X, Indeed, Glassdoor, Reddit, Medium and additional boards have **not** become working integrations merely because they were researched. Some require credentials, commercial permission or partner access. Medium can use configured public RSS as leads. User-supplied public employer pages can use the static-page route. There is no login, CAPTCHA bypass, private feed extraction or universal job-board scraper. See the [platform access inventory](research/discovery-platform-access.md) and [source-contract research](research/discovery-source-foundation.md).

## Matching and identity

The initial ranker combines BM25 text retrieval with evidence-based ranking through reciprocal rank fusion. Each skill match includes a candidate evidence reference and a job excerpt. The score is an experimental retrieval heuristic, not a hiring probability. It does not yet use embeddings, a candidate knowledge graph, licensing verification, transferable-skill inference or outcome learning. The retained API still uses its older shared matcher; it does not silently receive this ranker's full output.

Hard exclusions, explicit source applicant-country restrictions, remote requirements and comparable compensation constraints are assessed independently of fit. Missing geography stays unknown. Currency and pay period must agree before comparing salary. Timezone, payroll and sponsorship unknowns stay visible. The new ranker deliberately never emits `confirmed_eligible` from these sources alone. Verified authorization in one country cannot qualify a job worldwide.

Storage identity is source + external ID. Changed normalized content creates a new snapshot; unchanged polls update last-seen evidence. Raw records remain attached to the latest observation and stored snapshots. Matching clusters identical canonical URLs, preserves each source observation, and prefers employer ATS evidence over aggregate search evidence. Different URLs/requisitions are retained even with the same company/title. Cross-domain duplicates requiring entity resolution remain possible.

Only complete employer-board polls contribute disappearance evidence: one missing poll marks uncertainty, two mark closure. Search results, feeds, network failures and partial polls cannot close a role through absence. Expiry dates remove roles from active results. A direct source closure check can close a previously observed posting immediately.

## Retained API integration

Authenticated `POST /api/v1/workflow/discover-source` accepts:

```json
{ "provider": "ashby", "board": "linear" }
```

Providers: `greenhouse`, `ashby`, `lever`, `workable`, `himalayas`, `page`. Himalayas requires `query`; page requires `url`; employer ATS sources require `board`. Existing Greenhouse `POST /workflow/discover` remains supported. No arbitrary headers, credentials or fetch options are accepted.

The response includes `complete`, diagnostics and actual imported count. Imports retain provenance and refresh trusted source content and candidate assessment. Company/title similarity is no longer a unique identity. Manual reintake and unrelated secondary sources cannot overwrite established primary-source content. This route imports into PostgreSQL; it does not synchronize the separate CLI database or schedule native desktop work. The retained tenant/job match schema is not yet a per-person multi-user match model. Import batches can partially persist if a later database write fails; retry is idempotent by job identity, but a durable batch/checkpoint API is still needed.

## Boundaries and next implementation gates

- One reader serializes requests per host, defaults to at least one second between them, enforces a 20-second timeout and an 8 MB response cap. Source-specific Retry-After/conditional-request support remains work.
- Public IP validation rejects private, local, metadata and reserved targets; validated DNS is pinned to sockets. Redirects are revalidated; credentials cannot cross origins. Generic page/feed requests refuse cross-origin redirects so they cannot silently switch robots policies.
- Persistent source leases fence concurrent workers; disabling a source fences its outstanding poll. Interrupted runs can be recovered after the 15-minute lease expires.
- Paginated polls are bounded. There is **no durable backfill cursor yet**: queries larger than the page budget remain partial and later polls restart at the first page. Do not interpret the first pages as complete source coverage.
- Retrieval examines at most 5,000 active source observations. Stored history is not yet quota-managed or automatically pruned; monitor database size. There is no production-scale load or worldwide-recall benchmark.
- ATS endpoints do not enumerate every employer. Broad coverage needs a maintained employer registry, source-policy review, connector credentials where required, durable frontier/cursors and source-health metrics.
- The next product integration is a native discovery job with visible sourcing state, source controls, freshness, match evidence and pause/resume. It must run deterministic tools under explicit runtime permissions, rather than asking the conversation model to improvise a browser loop.
- Before selection can feed autopilot, wire verification, eligibility uncertainty and the exact prepared-payload policy into that executor. The standalone shortlist is not an auto-apply queue.

## Research and tests

The retrieval choice follows [BM25 baseline evidence in BEIR](https://arxiv.org/abs/2104.08663) and the original [reciprocal rank fusion paper](https://cormack.uwaterloo.ca/cormacksigir09-rrf.pdf). Neither proves this career ranker is better than alternatives; a consented, labelled cross-career evaluation is still required.

Run deterministic tests with `pnpm --filter @pursuit/discovery test`. `test/live-contract.ts` and `test/live-persistence.ts` are explicit read-only network checks, excluded from the ordinary test suite. See the [executed sourcing QA report](qa/DISCOVERY_REPORT.md) for results and limits.
