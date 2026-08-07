export type Project = {
  id: string;
  name: string;
  created_at: number | null;
  updated_at: number | null;
};

export type Account = {
  project_id: string;
  handle: string;
  link: string;
  followed_timestamp: number | null;
  keyword_categories: string;
  is_candidate: number;
  scrape_status: "not_scraped" | "scraped" | "private" | "error";
  followers: number | null;
  bio: string | null;
  is_private: number;
  posts_analyzed: number | null;
  mean_eng_rate: number | null;
  median_eng_rate: number | null;
  reach_score: number | null;
  resonance_score: number | null;
  resonance_stale: number;
  relevance_score: number | null;
  relevance_rationale: string | null;
  composite_score: number | null;
  status: "new" | "contacted" | "negotiating" | "booked" | "rejected" | "excluded";
  updated_at: number | null;
};

export type Settings = {
  project_id: string;
  brand_statement: string;
  icp: string;
  reach_bands: string; // JSON: [[threshold, score], ...]
  resonance_bands: string; // JSON
  weight_reach: number;
  weight_resonance: number;
  weight_relevance: number;
};

export type Band = [number, number];
