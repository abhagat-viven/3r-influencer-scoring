"use client";

import { useRef, useState, useTransition } from "react";
import { importFollowingExport } from "@/app/actions";

export default function ImportUploader({
  projectId,
  currentTotal,
}: {
  projectId: string;
  currentTotal: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ total: number; candidates: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setError(null);
    file
      .text()
      .then((text) => {
        startTransition(async () => {
          try {
            const res = await importFollowingExport(projectId, text);
            setResult(res);
          } catch (err) {
            setError((err as Error).message);
          }
        });
      })
      .catch((err) => setError(err.message));
  }

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium">Following export</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Instagram → Settings → Accounts Center → Your information and permissions →
            Export your information → select &quot;Following&quot; only, JSON format.
          </p>
        </div>
        <span className="text-sm text-zinc-500 whitespace-nowrap">
          {currentTotal.toLocaleString()} currently imported
        </span>
      </div>

      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:text-white file:px-3 file:py-1.5 file:text-sm dark:file:bg-zinc-100 dark:file:text-zinc-900"
        />
        {isPending && <span className="text-sm text-zinc-500">Parsing…</span>}
      </div>

      {result && (
        <p className="text-sm text-green-700 dark:text-green-400">
          Imported {result.total.toLocaleString()} accounts — {result.candidates} flagged as
          candidates by keyword match.
        </p>
      )}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
