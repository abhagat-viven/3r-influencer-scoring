"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProjectAction } from "@/app/actions";

export default function NewProjectForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function create() {
    if (!name.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const project = await createProjectAction(name.trim());
        router.push(`/projects/${project.id}`);
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  return (
    <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-6 space-y-3">
      <h2 className="font-medium">New project</h2>
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
          placeholder="e.g. Summer 2026 campaign"
          className="flex-1 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-1.5"
        />
        <button
          onClick={create}
          disabled={isPending || !name.trim()}
          className="rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          {isPending ? "Creating…" : "Create"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
