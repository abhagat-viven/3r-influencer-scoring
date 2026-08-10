"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Project } from "@/lib/types";

export default function ProjectSwitcher({
  projects,
  currentId,
}: {
  projects: Project[];
  currentId: string;
}) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2 text-sm">
      <select
        value={currentId}
        onChange={(e) => router.push(`/projects/${e.target.value}`)}
        className="rounded-md border border-line bg-surface px-2 py-1 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <Link href="/" className="text-ink-soft hover:text-ink underline decoration-dotted">
        All projects
      </Link>
    </div>
  );
}
