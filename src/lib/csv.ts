import type { Account } from "./types";

const COLUMNS: Array<{ key: keyof Account; label: string }> = [
  { key: "handle", label: "Handle" },
  { key: "link", label: "Instagram URL" },
  { key: "keyword_categories", label: "Category" },
  { key: "followers", label: "Followers" },
  { key: "reach_score", label: "Reach" },
  { key: "median_eng_rate", label: "Median Engagement Rate" },
  { key: "resonance_score", label: "Resonance" },
  { key: "relevance_score", label: "Relevance" },
  { key: "relevance_rationale", label: "Relevance Rationale" },
  { key: "composite_score", label: "Composite" },
  { key: "status", label: "Status" },
  { key: "scrape_status", label: "Scrape Status" },
  { key: "bio", label: "Bio" },
];

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes("\"") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function accountsToCsv(accounts: Account[]): string {
  const header = COLUMNS.map((c) => escapeCsvValue(c.label)).join(",");
  const rows = accounts.map((a) =>
    COLUMNS.map((c) => escapeCsvValue(a[c.key])).join(",")
  );
  return [header, ...rows].join("\n");
}
