import { getApiKeys } from "@/db/queries";

const ACTOR = "apify~instagram-profile-scraper";
const COST_PER_PROFILE_USD = 0.0026; // Apify free-tier price per dataset item (result)

export type ApifyProfile = {
  username: string;
  followersCount?: number;
  followsCount?: number;
  postsCount?: number;
  biography?: string;
  private?: boolean;
  verified?: boolean;
  latestPosts?: Array<{
    likesCount?: number | null;
    commentsCount?: number | null;
    timestamp?: string;
    isPinned?: boolean;
  }>;
};

// A token saved in Settings takes precedence over .env — Settings changes
// take effect immediately, whereas .env is only read once at process start.
// Shared across every project — one local instance, one Apify account.
export function resolveApifyToken(): string | undefined {
  const fromDb = getApiKeys().apify_api_token;
  return fromDb || process.env.APIFY_API_TOKEN;
}

export function estimateCostUsd(handleCount: number): number {
  return Math.round(handleCount * COST_PER_PROFILE_USD * 100) / 100;
}

export type ApifyBudget = {
  planLimitUsd: number;
  spentUsd: number;
  remainingUsd: number;
};

// Live check against Apify's own usage API — lets the UI show real remaining
// monthly credit alongside the estimate, not just a static per-profile price.
export async function getApifyBudget(): Promise<ApifyBudget | null> {
  const token = resolveApifyToken();
  if (!token) return null;

  try {
    const [meRes, usageRes] = await Promise.all([
      fetch("https://api.apify.com/v2/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("https://api.apify.com/v2/users/me/usage/monthly", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);
    if (!meRes.ok || !usageRes.ok) return null;

    const me = await meRes.json();
    const usage = await usageRes.json();

    const planLimitUsd: number = me.data?.plan?.maxMonthlyUsageUsd ?? 5;
    const spentUsd: number =
      usage.data?.totalUsageCreditsUsdAfterVolumeDiscount ??
      usage.data?.totalUsageCreditsUsdBeforeVolumeDiscount ??
      0;

    return {
      planLimitUsd,
      spentUsd: Math.round(spentUsd * 100) / 100,
      remainingUsd: Math.round((planLimitUsd - spentUsd) * 100) / 100,
    };
  } catch {
    return null;
  }
}

export type ApifyVerifyResult = { ok: boolean; username?: string; error?: string };

// Cheap, free metadata call — used to validate a token right after it's saved
// in Settings, rather than waiting for the first real scrape to discover a typo.
export async function verifyApifyToken(): Promise<ApifyVerifyResult> {
  const token = resolveApifyToken();
  if (!token) return { ok: false, error: "No token configured" };
  try {
    const res = await fetch("https://api.apify.com/v2/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    return { ok: true, username: data.data?.username };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function scrapeProfiles(usernames: string[]): Promise<ApifyProfile[]> {
  const token = resolveApifyToken();
  if (!token) {
    throw new Error("No Apify API token configured — add one in Settings.");
  }
  if (usernames.length === 0) return [];

  const res = await fetch(
    `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ usernames }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apify request failed (${res.status}): ${text}`);
  }

  return (await res.json()) as ApifyProfile[];
}
