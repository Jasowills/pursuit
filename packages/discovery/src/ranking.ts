import { tokens } from './text.js';
/** BM25 lexical retrieval (k1=1.2,b=.75), independent of model-token budgets. */
export function bm25(
  documents: { id: string; text: string }[],
  query: string,
): Map<string, number> {
  const terms = [...new Set(tokens(query))];
  const parsed = documents.map((d) => ({ id: d.id, terms: tokens(d.text).slice(0, 5000) }));
  const avg = parsed.reduce((sum, d) => sum + d.terms.length, 0) / (parsed.length || 1) || 1;
  const df = new Map<string, number>();
  for (const d of parsed) for (const t of new Set(d.terms)) df.set(t, (df.get(t) ?? 0) + 1);
  const scores = new Map<string, number>();
  for (const d of parsed) {
    const freq = new Map<string, number>();
    for (const t of d.terms) freq.set(t, (freq.get(t) ?? 0) + 1);
    let score = 0;
    for (const t of terms) {
      const f = freq.get(t) ?? 0;
      if (!f) continue;
      const n = df.get(t) ?? 0;
      const idf = Math.log(1 + (parsed.length - n + 0.5) / (n + 0.5));
      score += (idf * (f * 2.2)) / (f + 1.2 * (0.25 + (0.75 * d.terms.length) / avg));
    }
    scores.set(d.id, score);
  }
  return scores;
}
/** RRF combines ranks rather than pretending different scores share a probability scale. */
export function reciprocalRankFusion(rankings: string[][], k = 60): Map<string, number> {
  const scores = new Map<string, number>();
  for (const ranking of rankings)
    for (const [index, id] of [...new Set(ranking)].entries())
      scores.set(id, (scores.get(id) ?? 0) + 1 / (k + index + 1));
  return scores;
}
