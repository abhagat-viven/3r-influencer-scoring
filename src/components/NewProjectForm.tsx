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
    <div className="rounded-card border border-dashed border-line-strong p-6 space-y-3">
      <h2 className="font-medium text-ink">New project</h2>
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
          placeholder="e.g. Summer 2026 campaign"
          className="flex-1 text-sm rounded-md border border-line bg-surface text-ink placeholder:text-ink-faint px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        />
        <button
          onClick={create}
          disabled={isPending || !name.trim()}
          className="rounded-md bg-primary hover:bg-primary-hover text-white px-4 py-1.5 text-sm font-medium disabled:opacity-50 disabled:hover:bg-primary transition-colors"
        >
          {isPending ? "Creating…" : "Create"}
        </button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
