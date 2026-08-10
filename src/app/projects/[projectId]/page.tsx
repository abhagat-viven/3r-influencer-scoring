import Link from "next/link";
import { getDb } from "@/db";

export const dynamic = "force-dynamic";

function stat(label: string, value: number | string, href?: string) {
  const content = (
    <div className="rounded-card border border-line bg-surface shadow-card p-6">
      <div className="text-3xl font-semibold text-primary">{value}</div>
      <div className="text-sm text-ink-soft mt-1">{label}</div>
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
        <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
        <p className="text-ink-soft mt-1">
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
        <div className="rounded-card border border-line bg-surface shadow-card p-6">
          <h2 className="font-medium text-ink mb-4">Top scored accounts</h2>
          <div className="space-y-1">
            {topAccounts.map((a) => (
              <div
                key={a.handle}
                className="grid grid-cols-[1fr_1fr_auto] items-baseline gap-4 text-sm text-ink py-1"
              >
                <span className="truncate">@{a.handle}</span>
                <span className="text-ink-soft tabular-nums text-center">
                  {a.followers?.toLocaleString()} followers
                </span>
                <span className="font-medium tabular-nums text-right w-12">
                  {a.composite_score.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <Link
            href={`/projects/${projectId}/accounts`}
            className="inline-block mt-4 text-sm text-primary hover:underline"
          >
            View all accounts →
          </Link>
        </div>
      )}

      {totalFollowing === 0 && (
        <div className="rounded-card border border-dashed border-line-strong p-8 text-center">
          <p className="text-ink-soft">No data yet.</p>
          <Link
            href={`/projects/${projectId}/import`}
            className="inline-block mt-3 text-primary font-medium hover:underline"
          >
            Import your Instagram following export →
          </Link>
        </div>
      )}
    </div>
  );
}
