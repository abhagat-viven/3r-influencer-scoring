"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { parseFollowingExport } from "@/lib/keywordCategorize";
import { computeEngagement, bandScore, parseBands, computeComposite } from "@/lib/scoring";
import { scrapeProfiles, estimateCostUsd, getApifyBudget, verifyApifyToken } from "@/lib/apify";
import {
  scoreRelevanceWithClaude,
  isClaudeConfigured,
  RELEVANCE_COST_PER_ACCOUNT_USD,
  verifyAnthropicKey,
} from "@/lib/relevance";
import { accountsToCsv } from "@/lib/csv";
import {
  upsertFollowingEntries,
  setCandidateFlag,
  getAccount,
  applyScrapeResult,
  getSettings,
  saveSettings,
  listAccounts,
  createProject,
  listProjects,
  saveApiKeys as saveApiKeysToDb,
} from "@/db/queries";
import { getDb } from "@/db";
import type { Settings } from "@/lib/types";

// Re-derives Reach and Resonance from the raw stored values (followers, median
// engagement rate) using whatever bands are CURRENTLY in Settings — not just
// recombining whatever reach_score/resonance_score happen to be stored, which
// would still reflect the bands active at scrape time. This is what makes
// changing band thresholds actually take effect on existing accounts.
function recompute(projectId: string, handle: string, settings: Settings) {
  const account = getAccount(projectId, handle);
  if (!account) return;

  const reachBands = parseBands(settings.reach_bands);
  const resonanceBands = parseBands(settings.resonance_bands);

  const reachScore =
    account.followers != null ? bandScore(account.followers, reachBands) : null;
  const resonanceScore =
    account.median_eng_rate != null ? bandScore(account.median_eng_rate, resonanceBands) : null;

  const composite = computeComposite(reachScore, resonanceScore, account.relevance_score, {
    reach: settings.weight_reach,
    resonance: settings.weight_resonance,
    relevance: settings.weight_relevance,
  });

  applyScrapeResult(projectId, handle, {
    reach_score: reachScore,
    resonance_score: resonanceScore,
    composite_score: composite,
  });
}

// --- Projects ---

export async function createProjectAction(name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Project name is required.");
  const project = createProject(randomUUID(), trimmed);
  revalidatePath("/");
  return project;
}

export async function listMyProjects() {
  return listProjects();
}

// --- Import ---

export async function importFollowingExport(projectId: string, fileContent: string) {
  const raw = JSON.parse(fileContent);
  const entries = parseFollowingExport(raw);
  upsertFollowingEntries(projectId, entries);
  revalidatePath(`/projects/${projectId}/import`);
  revalidatePath(`/projects/${projectId}/accounts`);
  const candidateCount = entries.filter((e) => e.isCandidate).length;
  return { total: entries.length, candidates: candidateCount };
}

export async function setCandidate(projectId: string, handle: string, isCandidate: boolean) {
  setCandidateFlag(projectId, handle, isCandidate);
  revalidatePath(`/projects/${projectId}/import`);
  revalidatePath(`/projects/${projectId}/pipeline`);
}

export async function searchNonCandidateAccounts(projectId: string, query: string) {
  if (query.trim().length < 2) return [];
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT handle, link FROM accounts WHERE project_id = ? AND is_candidate = 0 AND handle LIKE ? ORDER BY handle LIMIT 20"
    )
    .all(projectId, `%${query}%`) as Array<{ handle: string; link: string }>;
  return rows.map((r) => ({ handle: r.handle, link: r.link }));
}

// --- Pipeline ---

export async function estimateScrapeCost(handleCount: number) {
  return estimateCostUsd(handleCount);
}

export async function fetchApifyBudget(_projectId: string) {
  return getApifyBudget();
}

export async function exportCandidatesCsv(projectId: string) {
  const accounts = listAccounts(projectId, { candidatesOnly: true });
  return accountsToCsv(accounts);
}

export async function runScrapeBatch(projectId: string, handles: string[]) {
  if (handles.length === 0) return { scraped: 0, errors: [] as string[] };
  const settings = getSettings(projectId);
  const reachBands = parseBands(settings.reach_bands);
  const resonanceBands = parseBands(settings.resonance_bands);

  const profiles = await scrapeProfiles(handles);
  const errors: string[] = [];
  const returnedHandles = new Set(profiles.map((p) => p.username));

  for (const p of profiles) {
    const followers = p.followersCount ?? 0;
    const reachScore = bandScore(followers, reachBands);

    if (p.private) {
      applyScrapeResult(projectId, p.username, {
        scrape_status: "private",
        followers,
        bio: p.biography ?? null,
        is_private: 1,
        reach_score: reachScore,
        posts_analyzed: 0,
        resonance_stale: 0,
      });
      recompute(projectId, p.username, settings);
      continue;
    }

    const { meanRate, medianRate, postsAnalyzed, stale } = computeEngagement(
      p.latestPosts ?? [],
      followers
    );
    const resonanceScore = medianRate !== null ? bandScore(medianRate, resonanceBands) : null;

    applyScrapeResult(projectId, p.username, {
      scrape_status: "scraped",
      followers,
      bio: p.biography ?? null,
      is_private: 0,
      posts_analyzed: postsAnalyzed,
      mean_eng_rate: meanRate,
      median_eng_rate: medianRate,
      reach_score: reachScore,
      resonance_score: resonanceScore,
      resonance_stale: stale ? 1 : 0,
    });
    recompute(projectId, p.username, settings);
  }

  for (const h of handles) {
    if (!returnedHandles.has(h)) {
      applyScrapeResult(projectId, h, { scrape_status: "error" });
      errors.push(h);
    }
  }

  revalidatePath(`/projects/${projectId}/pipeline`);
  revalidatePath(`/projects/${projectId}/accounts`);
  return { scraped: profiles.length, errors };
}

export async function updateRelevanceManual(
  projectId: string,
  handle: string,
  score: number,
  rationale: string
) {
  applyScrapeResult(projectId, handle, { relevance_score: score, relevance_rationale: rationale });
  recompute(projectId, handle, getSettings(projectId));
  revalidatePath(`/projects/${projectId}/accounts`);
}

export async function runClaudeRelevanceBatch(projectId: string, handles: string[]) {
  if (!isClaudeConfigured()) {
    throw new Error("ANTHROPIC_API_KEY is not set — use manual relevance entry instead.");
  }
  const settings = getSettings(projectId);
  const results: Array<{ handle: string; ok: boolean; error?: string }> = [];

  for (const handle of handles) {
    const account = getAccount(projectId, handle);
    if (!account) continue;
    try {
      const result = await scoreRelevanceWithClaude({
        handle,
        bio: account.bio ?? "",
        sampleCaptions: [],
        brandStatement: settings.brand_statement,
        icp: settings.icp,
      });
      applyScrapeResult(projectId, handle, {
        relevance_score: result.score,
        relevance_rationale: result.rationale,
      });
      recompute(projectId, handle, settings);
      results.push({ handle, ok: true });
    } catch (err) {
      results.push({ handle, ok: false, error: (err as Error).message });
    }
  }

  revalidatePath(`/projects/${projectId}/accounts`);
  return results;
}

export async function updateAccountStatus(projectId: string, handle: string, status: string) {
  applyScrapeResult(projectId, handle, { status: status as never });
  revalidatePath(`/projects/${projectId}/accounts`);
}

// --- Settings ---

export async function updateSettingsAction(projectId: string, fields: Partial<Settings>) {
  saveSettings(projectId, fields);

  // Reach/Resonance bands and weights affect every existing score, not just
  // future ones — recompute all candidates now (all local arithmetic on
  // already-stored data, no external calls) rather than leaving stale scores
  // around until each account happens to get touched again.
  const settings = getSettings(projectId);
  for (const account of listAccounts(projectId, { candidatesOnly: true })) {
    recompute(projectId, account.handle, settings);
  }

  revalidatePath(`/projects/${projectId}/settings`);
  revalidatePath(`/projects/${projectId}/accounts`);
  revalidatePath(`/projects/${projectId}/pipeline`);
}

// How many already-scored candidates would need re-scoring if the brand
// statement/ICP changes, and what that would cost if done via Claude. Reach
// and Resonance never need this — they recompute for free from stored data
// (see updateSettingsAction above); only Relevance requires either a paid
// Claude call or manual re-entry to actually re-judge against new criteria.
export async function estimateRelevanceRescoreImpact(projectId: string) {
  const scored = listAccounts(projectId, { candidatesOnly: true }).filter(
    (a) => a.relevance_score != null
  );
  return {
    accountCount: scored.length,
    estimatedCostUsd:
      Math.round(scored.length * RELEVANCE_COST_PER_ACCOUNT_USD * 100) / 100,
    claudeConfigured: isClaudeConfigured(),
  };
}

// Explicit opt-in action — re-runs Claude relevance scoring for every
// candidate that already has a Relevance score, using whatever brand
// statement/ICP is currently saved. Never fires automatically: Settings only
// offers this as a button after saving, so a real API cost is always a
// deliberate choice, not a side effect of editing text fields.
export async function rescoreAllRelevance(projectId: string) {
  const handles = listAccounts(projectId, { candidatesOnly: true })
    .filter((a) => a.relevance_score != null)
    .map((a) => a.handle);
  return runClaudeRelevanceBatch(projectId, handles);
}

// API keys are shared across every project in this single local instance, not
// scoped to a project. Saves whichever key(s) were actually typed (blank =
// leave the existing one untouched — the input never gets pre-filled with the
// real secret, so a blank submit can't accidentally wipe a working key), then
// live-verifies each one that was just touched so a typo surfaces immediately
// rather than on the next scrape or relevance call.
export async function saveApiKeys(fields: { apifyApiToken?: string; anthropicApiKey?: string }) {
  const updates: { apify_api_token?: string; anthropic_api_key?: string } = {};
  if (fields.apifyApiToken?.trim()) updates.apify_api_token = fields.apifyApiToken.trim();
  if (fields.anthropicApiKey?.trim()) updates.anthropic_api_key = fields.anthropicApiKey.trim();
  if (Object.keys(updates).length > 0) saveApiKeysToDb(updates);

  revalidatePath("/", "layout");

  const results: { apify?: Awaited<ReturnType<typeof verifyApifyToken>>; anthropic?: Awaited<ReturnType<typeof verifyAnthropicKey>> } = {};
  if (fields.apifyApiToken?.trim()) results.apify = await verifyApifyToken();
  if (fields.anthropicApiKey?.trim()) results.anthropic = await verifyAnthropicKey();
  return results;
}
