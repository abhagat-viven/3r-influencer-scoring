import type { Band } from "./types";

export function bandScore(value: number, bands: Band[]): number {
  for (const [threshold, score] of bands) {
    if (value < threshold) return score;
  }
  return bands[bands.length - 1][1];
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export type ApifyPost = {
  likesCount?: number | null;
  commentsCount?: number | null;
  timestamp?: string;
  isPinned?: boolean;
};

export type EngagementResult = {
  meanRate: number | null;
  medianRate: number | null;
  postsAnalyzed: number;
  stale: boolean;
};

// A pinned post isn't necessarily old (a creator can pin something posted five
// minutes ago), and an unpinned post isn't necessarily recent (an infrequent
// poster's "latest 12" can stretch back months) — so recency is judged by
// timestamp, not the isPinned flag. Anything older than this window is
// excluded from Resonance.
const RESONANCE_RECENCY_WINDOW_DAYS = 90;

// Uses the median across recent posts rather than the mean — a single viral Reel
// (pushed to non-followers via Explore) can inflate the mean far beyond what's
// representative of typical engagement with the account's actual audience.
// If none of the returned posts fall inside the recency window (an inactive or
// very infrequent poster), falls back to scoring on whatever was returned
// anyway, flagged `stale` so the caller can surface that the number reflects
// old content rather than current performance.
export function computeEngagement(posts: ApifyPost[], followers: number): EngagementResult {
  if (!posts.length || !followers) {
    return { meanRate: null, medianRate: null, postsAnalyzed: 0, stale: false };
  }
  const cutoff = Date.now() - RESONANCE_RECENCY_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const recent = posts.filter((p) => p.timestamp && new Date(p.timestamp).getTime() >= cutoff);
  const stale = recent.length === 0;
  const pool = stale ? posts : recent;

  const perPost = pool.map((p) => (p.likesCount ?? 0) + (p.commentsCount ?? 0));
  const meanRate = perPost.reduce((a, b) => a + b, 0) / perPost.length / followers;
  const medianRate = median(perPost) / followers;
  return { meanRate, medianRate, postsAnalyzed: pool.length, stale };
}

export function computeComposite(
  reach: number | null,
  resonance: number | null,
  relevance: number | null,
  weights: { reach: number; resonance: number; relevance: number }
): number | null {
  const parts: Array<[number | null, number]> = [
    [reach, weights.reach],
    [resonance, weights.resonance],
    [relevance, weights.relevance],
  ];
  const present = parts.filter(([v]) => v !== null) as Array<[number, number]>;
  if (present.length < 3) return null; // all three R's required before a composite is meaningful
  const totalWeight = present.reduce((sum, [, w]) => sum + w, 0);
  const weightedSum = present.reduce((sum, [v, w]) => sum + v * w, 0);
  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

export function parseBands(json: string): Band[] {
  return JSON.parse(json) as Band[];
}
