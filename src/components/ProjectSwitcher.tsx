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
        className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1"
      >
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <Link
        href="/"
        className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 underline decoration-dotted"
      >
        All projects
      </Link>
    </div>
  );
}
