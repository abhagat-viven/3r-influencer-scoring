import Link from "next/link";
import { getDb } from "@/db";

export const dynamic = "force-dynamic";

function stat(label: string, value: number | string, href?: string) {
  const content = (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
      <div className="text-3xl font-semibold">{value}</div>
      <div className="text-sm text-zinc-500 mt-1">{label}</div>
    </div>
  );
  return href ? (
    <Link href={href} className="block hover:opacity-80 transition-opacity">
      {content}
    </Link>
  ) : (
    content
  );
}

export default async function Dashboard({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const db = getDb();

  function count(where: string): number {
    const row = db
      .prepare(`SELECT COUNT(*) as c FROM accounts WHERE project_id = ? AND ${where}`)
      .get(projectId) as { c: number };
    return row.c;
  }

  const totalFollowing = (
    db.prepare("SELECT COUNT(*) as c FROM accounts WHERE project_id = ?").get(projectId) as {
      c: number;
    }
  ).c;
  const candidates = count("is_candidate = 1");
  const scraped = count("(scrape_status = 'scraped' OR scrape_status = 'private')");
  const scored = count("composite_score IS NOT NULL");
  const topAccounts = db
    .prepare(
      "SELECT handle, followers, composite_score FROM accounts WHERE project_id = ? AND composite_score IS NOT NULL ORDER BY composite_score DESC LIMIT 5"
    )
    .all(projectId) as Array<{ handle: string; followers: number; composite_score: number }>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-zinc-500 mt-1">
          Reach · Resonance · Relevance scoring for your Instagram following list.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stat("Following imported", totalFollowing, `/projects/${projectId}/import`)}
        {stat("Candidate shortlist", candidates, `/projects/${projectId}/import`)}
        {stat("Profiles scraped", scraped, `/projects/${projectId}/pipeline`)}
        {stat("Fully scored", scored, `/projects/${projectId}/accounts`)}
      </div>

      {topAccounts.length > 0 && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <h2 className="font-medium mb-4">Top scored accounts</h2>
          <div className="space-y-2">
            {topAccounts.map((a) => (
              <div key={a.handle} className="flex items-center justify-between text-sm">
                <span>@{a.handle}</span>
                <span className="text-zinc-500">{a.followers?.toLocaleString()} followers</span>
                <span className="font-medium">{a.composite_score.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <Link
            href={`/projects/${projectId}/accounts`}
            className="inline-block mt-4 text-sm text-blue-600 dark:text-blue-400"
          >
            View all accounts →
          </Link>
        </div>
      )}

      {totalFollowing === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center">
          <p className="text-zinc-500">No data yet.</p>
          <Link
            href={`/projects/${projectId}/import`}
            className="inline-block mt-3 text-blue-600 dark:text-blue-400 font-medium"
          >
            Import your Instagram following export →
          </Link>
        </div>
      )}
    </div>
  );
}
