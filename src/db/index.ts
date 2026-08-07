import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

const DB_PATH = path.join(process.cwd(), "data", "influencer.db");
const DEFAULT_PROJECT_ID = "default";

declare global {
  // eslint-disable-next-line no-var
  var __im_db__: DatabaseSync | undefined;
}

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at INTEGER,
    updated_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS accounts (
    project_id TEXT NOT NULL REFERENCES projects(id),
    handle TEXT NOT NULL,
    link TEXT NOT NULL,
    followed_timestamp INTEGER,
    keyword_categories TEXT DEFAULT '',
    is_candidate INTEGER DEFAULT 0,
    scrape_status TEXT DEFAULT 'not_scraped',
    followers INTEGER,
    bio TEXT,
    is_private INTEGER DEFAULT 0,
    posts_analyzed INTEGER,
    mean_eng_rate REAL,
    median_eng_rate REAL,
    reach_score INTEGER,
    resonance_score INTEGER,
    resonance_stale INTEGER DEFAULT 0,
    relevance_score INTEGER,
    relevance_rationale TEXT,
    composite_score REAL,
    status TEXT DEFAULT 'new',
    updated_at INTEGER,
    PRIMARY KEY (project_id, handle)
  );

  CREATE TABLE IF NOT EXISTS settings (
    project_id TEXT PRIMARY KEY REFERENCES projects(id),
    brand_statement TEXT DEFAULT '',
    icp TEXT DEFAULT '',
    reach_bands TEXT DEFAULT '[[5000,1],[20000,2],[100000,3],[500000,4],[999999999,5]]',
    resonance_bands TEXT DEFAULT '[[0.01,1],[0.03,2],[0.06,3],[0.10,4],[999,5]]',
    weight_reach REAL DEFAULT 1,
    weight_resonance REAL DEFAULT 1,
    weight_relevance REAL DEFAULT 1
  );

  -- Single-row table: bring-your-own Apify/Anthropic keys, entered once in
  -- Settings and shared across every project. No user accounts in this
  -- version — it's meant to run on your own machine for you alone.
  CREATE TABLE IF NOT EXISTS app_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    apify_api_token TEXT DEFAULT '',
    anthropic_api_key TEXT DEFAULT ''
  );
`;

function openDb(): DatabaseSync {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec(SCHEMA_SQL);
  db.exec("INSERT OR IGNORE INTO app_config (id) VALUES (1)");

  const now = Date.now();
  db.prepare(
    "INSERT OR IGNORE INTO projects (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)"
  ).run(DEFAULT_PROJECT_ID, "My first project", now, now);
  db.prepare("INSERT OR IGNORE INTO settings (project_id) VALUES (?)").run(DEFAULT_PROJECT_ID);

  return db;
}

export function getDb(): DatabaseSync {
  if (!global.__im_db__) {
    global.__im_db__ = openDb();
  }
  return global.__im_db__;
}
