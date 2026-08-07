import type { SQLInputValue } from "node:sqlite";
import { getDb } from "./index";
import type { Account, Settings, Project } from "@/lib/types";
import type { ParsedFollowingEntry } from "@/lib/keywordCategorize";

// node:sqlite rows aren't plain objects (they fail React Server Components'
// "only plain objects" serialization check when passed straight to a Client
// Component) — spread into a fresh plain object before returning.
function toPlain<T>(row: unknown): T {
  return { ...(row as object) } as T;
}

// Builds a `col1 = ?, col2 = ?, ...` clause for a dynamic partial update.
function buildSetClause(
  fields: Record<string, SQLInputValue>
): { clause: string; values: SQLInputValue[] } {
  const keys = Object.keys(fields);
  const clause = keys.map((k) => `${k} = ?`).join(", ");
  const values = keys.map((k) => fields[k]);
  return { clause, values };
}

export function upsertFollowingEntries(projectId: string, entries: ParsedFollowingEntry[]): void {
  if (entries.length === 0) return;
  const db = getDb();
  const now = Date.now();

  const upsert = db.prepare(`
    INSERT INTO accounts (project_id, handle, link, followed_timestamp, keyword_categories, is_candidate, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (project_id, handle) DO UPDATE SET
      link = excluded.link,
      followed_timestamp = excluded.followed_timestamp,
      keyword_categories = excluded.keyword_categories,
      is_candidate = excluded.is_candidate,
      updated_at = excluded.updated_at
  `);

  db.exec("BEGIN");
  try {
    for (const e of entries) {
      upsert.run(
        projectId,
        e.handle,
        e.link,
        e.followedTimestamp,
        e.categories.join(";"),
        e.isCandidate ? 1 : 0,
        now
      );
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

export function listAccounts(
  projectId: string,
  filter?: { candidatesOnly?: boolean }
): Account[] {
  const db = getDb();
  const query = filter?.candidatesOnly
    ? "SELECT * FROM accounts WHERE project_id = ? AND is_candidate = 1 ORDER BY followers IS NULL, followers DESC"
    : "SELECT * FROM accounts WHERE project_id = ? ORDER BY followed_timestamp DESC";
  return (db.prepare(query).all(projectId) as unknown[]).map((r) => toPlain<Account>(r));
}

export function getAccount(projectId: string, handle: string): Account | undefined {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM accounts WHERE project_id = ? AND handle = ?")
    .get(projectId, handle);
  return row ? toPlain<Account>(row) : undefined;
}

export function setCandidateFlag(projectId: string, handle: string, isCandidate: boolean): void {
  const db = getDb();
  db.prepare("UPDATE accounts SET is_candidate = ? WHERE project_id = ? AND handle = ?").run(
    isCandidate ? 1 : 0,
    projectId,
    handle
  );
}

export function applyScrapeResult(projectId: string, handle: string, fields: Partial<Account>): void {
  const keys = Object.keys(fields);
  if (keys.length === 0) return;
  const db = getDb();
  const { clause, values } = buildSetClause(fields);
  db.prepare(
    `UPDATE accounts SET ${clause}, updated_at = ? WHERE project_id = ? AND handle = ?`
  ).run(...values, Date.now(), projectId, handle);
}

export function updateAccountFields(projectId: string, handle: string, fields: Partial<Account>): void {
  applyScrapeResult(projectId, handle, fields);
}

export function getSettings(projectId: string): Settings {
  const db = getDb();
  db.prepare("INSERT OR IGNORE INTO settings (project_id) VALUES (?)").run(projectId);
  return toPlain<Settings>(
    db.prepare("SELECT * FROM settings WHERE project_id = ?").get(projectId)
  );
}

export function saveSettings(projectId: string, fields: Partial<Settings>): void {
  const keys = Object.keys(fields);
  if (keys.length === 0) return;
  const db = getDb();
  const { clause, values } = buildSetClause(fields);
  db.prepare(`UPDATE settings SET ${clause} WHERE project_id = ?`).run(...values, projectId);
}

// --- App-wide API keys (Apify/Anthropic) ---
// Single local instance, no user accounts, so these live in one row shared
// by every project rather than being scoped to a user.

export function getApiKeys(): { apify_api_token: string; anthropic_api_key: string } {
  const db = getDb();
  return toPlain(
    db.prepare("SELECT apify_api_token, anthropic_api_key FROM app_config WHERE id = 1").get()
  );
}

export function saveApiKeys(
  fields: Partial<{ apify_api_token: string; anthropic_api_key: string }>
): void {
  const keys = Object.keys(fields);
  if (keys.length === 0) return;
  const db = getDb();
  const { clause, values } = buildSetClause(fields);
  db.prepare(`UPDATE app_config SET ${clause} WHERE id = 1`).run(...values);
}

// --- Projects ---

export function createProject(id: string, name: string): Project {
  const db = getDb();
  const now = Date.now();
  db.prepare("INSERT INTO projects (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)").run(
    id,
    name,
    now,
    now
  );
  // Every project needs a settings row to exist from the start (getSettings
  // also does this defensively, but creating it here keeps things obvious).
  db.prepare("INSERT OR IGNORE INTO settings (project_id) VALUES (?)").run(id);
  return getProject(id)!;
}

export function getProject(id: string): Project | undefined {
  const db = getDb();
  const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
  return row ? toPlain<Project>(row) : undefined;
}

export function listProjects(): Project[] {
  const db = getDb();
  return (db.prepare("SELECT * FROM projects ORDER BY created_at ASC").all() as unknown[]).map(
    (r) => toPlain<Project>(r)
  );
}
