// Keywords safe to substring-match anywhere (long/distinctive, low collision risk).
const SUBSTRING_KEYWORD_CATEGORIES: Record<string, string[]> = {
  ai_tech_creator: ["gpt", "tech", "coder", "cursor"],
  career_upskill: ["career", "upskill", "resume", "interview", "recruit", "placement", "hiring"],
  mba_consulting_corporate: ["consult", "corporate", "insideiim"],
  finance_edtech: ["finance", "invest", "market", "coursera", "udemy"],
};

// Short/ambiguous keywords that collide with common name substrings (ai in Jain/Saini,
// hr in Mehra/Chronicle, pm in many words) — only match as a distinct token.
const TOKEN_KEYWORD_CATEGORIES: Record<string, string[]> = {
  ai_tech_creator: ["ai", "data", "code", "build"],
  career_upskill: ["job", "hr", "jobs"],
  mba_consulting_corporate: ["iim", "mba", "pm", "product"],
  finance_edtech: ["money", "stock", "quant", "learn"],
};

const BRAND_BLOCKLIST = new Set([
  "coursera", "upwork", "udemy", "runwayapp", "atlassian", "microsoft", "figma",
  "duolingo", "openai", "googleindia", "netflix_in", "9gag", "slackhq", "mongodb",
  "trycursor", "claudeai", "browserstack", "groww_official", "etmoney_official",
  "societegenerale", "underarmourind", "underarmour", "newbalanceindia", "royalenfield",
  "candycrushsaga", "morningbrew", "bloombergbusiness", "finshots.in",
]);

export function categorize(handle: string): string[] {
  const h = handle.toLowerCase();
  const tokens = new Set(h.split(/[._-]+/).filter(Boolean));
  const matches = new Set<string>();

  for (const [cat, keywords] of Object.entries(SUBSTRING_KEYWORD_CATEGORIES)) {
    if (keywords.some((kw) => h.includes(kw))) matches.add(cat);
  }
  for (const [cat, keywords] of Object.entries(TOKEN_KEYWORD_CATEGORIES)) {
    if (keywords.some((kw) => tokens.has(kw))) matches.add(cat);
  }
  return Array.from(matches);
}

export function isKnownBrand(handle: string): boolean {
  return BRAND_BLOCKLIST.has(handle.toLowerCase());
}

export type ParsedFollowingEntry = {
  handle: string;
  link: string;
  followedTimestamp: number;
  categories: string[];
  isCandidate: boolean;
};

// Parses Instagram's "Download Your Information" following.json export format.
export function parseFollowingExport(raw: unknown): ParsedFollowingEntry[] {
  const data = raw as {
    relationships_following?: Array<{
      title: string;
      string_list_data: Array<{ href: string; timestamp: number }>;
    }>;
  };
  const entries = data.relationships_following ?? [];
  return entries.map((entry) => {
    const handle = entry.title;
    const ts = entry.string_list_data?.[0]?.timestamp ?? 0;
    const categories = categorize(handle);
    const isCandidate = categories.length > 0 && !isKnownBrand(handle);
    return {
      handle,
      link: `https://www.instagram.com/${handle}/`,
      followedTimestamp: ts,
      categories,
      isCandidate,
    };
  });
}
