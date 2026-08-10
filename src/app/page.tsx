import Link from "next/link";
import { listProjects } from "@/db/queries";
import { getDb } from "@/db";
import NewProjectForm from "@/components/NewProjectForm";

export const dynamic = "force-dynamic";

export default function ProjectsPage() {
  const projects = listProjects();
  const db = getDb();

  const counts = new Map(
    projects.map((p) => {
      const row = db.prepare("SELECT COUNT(*) as c FROM accounts WHERE project_id = ?").get(
        p.id
      ) as { c: number };
      return [p.id, row.c] as [string, number];
    })
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Your projects</h1>
        <p className="text-ink-soft mt-1">
          Each project has its own following list and scoring settings. API keys (Apify,
          Anthropic) are shared across all of them — set once in any project&apos;s Settings.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((p) => (
          <Link
            key={p.id}
            href={`/projects/${p.id}`}
            className="rounded-card border border-line bg-surface shadow-card p-6 hover:border-primary transition-colors"
          >
            <div className="font-medium text-ink">{p.name}</div>
            <div className="text-sm text-ink-soft mt-1">
              {(counts.get(p.id) ?? 0).toLocaleString()} accounts imported
            </div>
          </Link>
        ))}
      </div>

      <NewProjectForm />
    </div>
  );
}
