"use client";

import { useRef, useState, useTransition } from "react";
import { updateRelevanceManual, runClaudeRelevanceBatch } from "@/app/actions";
import type { Account } from "@/lib/types";

type ColKey = "handle" | "bio" | "score" | "rationale" | "action";

const COLUMNS: Array<{ key: ColKey; label: string; resizable: boolean }> = [
  { key: "handle", label: "Account", resizable: true },
  { key: "bio", label: "Bio", resizable: true },
  { key: "score", label: "Relevance", resizable: true },
  { key: "rationale", label: "Rationale", resizable: true },
  { key: "action", label: "", resizable: false },
];

const DEFAULT_WIDTHS: Record<ColKey, number> = {
  handle: 260,
  bio: 340,
  score: 110,
  rationale: 340,
  action: 90,
};

const DEFAULT_ROW_HEIGHT = 64;
const MIN_COL_WIDTH = 70;
const MIN_ROW_HEIGHT = 40;

export default function RelevanceGrid({
  projectId,
  needsRelevance,
  claudeConfigured,
}: {
  projectId: string;
  needsRelevance: Account[];
  claudeConfigured: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [drafts, setDrafts] = useState<Record<string, { score: string; rationale: string }>>({});
  const [savedHandles, setSavedHandles] = useState<Set<string>>(new Set());
  const [colWidths, setColWidths] = useState<Record<ColKey, number>>(DEFAULT_WIDTHS);
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({});

  const dragRef = useRef<{
    type: "col" | "row";
    key: string;
    startPos: number;
    startSize: number;
  } | null>(null);

  function draftFor(handle: string) {
    return drafts[handle] ?? { score: "", rationale: "" };
  }

  function save(handle: string) {
    const d = draftFor(handle);
    const score = Number(d.score);
    if (!score || score < 1 || score > 5) return;
    startTransition(async () => {
      await updateRelevanceManual(projectId, handle, score, d.rationale);
      setSavedHandles((prev) => new Set(prev).add(handle));
    });
  }

  function runClaude() {
    startTransition(async () => {
      const handles = needsRelevance.map((a) => a.handle);
      const results = await runClaudeRelevanceBatch(projectId, handles);
      setSavedHandles((prev) => {
        const next = new Set(prev);
        for (const r of results) if (r.ok) next.add(r.handle);
        return next;
      });
    });
  }

  function startColResize(e: React.MouseEvent, key: ColKey) {
    e.preventDefault();
    dragRef.current = { type: "col", key, startPos: e.clientX, startSize: colWidths[key] };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  function startRowResize(e: React.MouseEvent, handle: string) {
    e.preventDefault();
    dragRef.current = {
      type: "row",
      key: handle,
      startPos: e.clientY,
      startSize: rowHeights[handle] ?? DEFAULT_ROW_HEIGHT,
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  function onMouseMove(e: MouseEvent) {
    const d = dragRef.current;
    if (!d) return;
    if (d.type === "col") {
      const delta = e.clientX - d.startPos;
      setColWidths((prev) => ({
        ...prev,
        [d.key]: Math.max(MIN_COL_WIDTH, d.startSize + delta),
      }));
    } else {
      const delta = e.clientY - d.startPos;
      setRowHeights((prev) => ({
        ...prev,
        [d.key]: Math.max(MIN_ROW_HEIGHT, d.startSize + delta),
      }));
    }
  }

  function onMouseUp() {
    dragRef.current = null;
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }

  const remaining = needsRelevance.filter((a) => !savedHandles.has(a.handle));
  const gridTemplateColumns = COLUMNS.map((c) => `${colWidths[c.key]}px`).join(" ");

  return (
    <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Step 2 — Relevance ({remaining.length} pending)</h2>
        {claudeConfigured ? (
          <button
            onClick={runClaude}
            disabled={isPending || remaining.length === 0}
            className="rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
          >
            {isPending ? "Scoring…" : "Auto-score with Claude"}
          </button>
        ) : (
          <span className="text-xs text-zinc-500">
            No ANTHROPIC_API_KEY set — score manually below, or add a key to Settings later.
          </span>
        )}
      </div>

      {remaining.length === 0 ? (
        <p className="text-sm text-zinc-500">Nothing pending.</p>
      ) : (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-md overflow-x-auto select-none">
          {/* Header row */}
          <div
            className="grid bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-500"
            style={{ gridTemplateColumns }}
          >
            {COLUMNS.map((col) => (
              <div key={col.key} className="relative px-3 py-2 truncate">
                {col.label}
                {col.resizable && (
                  <div
                    onMouseDown={(e) => startColResize(e, col.key)}
                    className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-blue-400/50"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Body rows */}
          {remaining.map((a) => {
            const height = rowHeights[a.handle] ?? DEFAULT_ROW_HEIGHT;
            const d = draftFor(a.handle);
            return (
              <div
                key={a.handle}
                className="relative grid border-b border-zinc-100 dark:border-zinc-800/50 last:border-b-0"
                style={{ gridTemplateColumns, height }}
              >
                <div className="px-3 py-1.5 overflow-hidden">
                  <a
                    href={a.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:underline block truncate"
                  >
                    @{a.handle}
                  </a>
                  <a
                    href={a.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline block truncate"
                  >
                    {a.link}
                  </a>
                </div>
                <div className="px-3 py-1.5 text-xs text-zinc-500 overflow-y-auto">{a.bio}</div>
                <div className="px-3 py-1.5">
                  <select
                    value={d.score}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [a.handle]: { ...draftFor(a.handle), score: e.target.value },
                      }))
                    }
                    className="w-full h-full text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1"
                  >
                    <option value="">Score</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>
                <div className="px-3 py-1.5">
                  <textarea
                    placeholder="One-sentence rationale…"
                    value={d.rationale}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [a.handle]: { ...draftFor(a.handle), rationale: e.target.value },
                      }))
                    }
                    className="w-full h-full resize-none text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1"
                  />
                </div>
                <div className="px-3 py-1.5 flex items-start">
                  <button
                    onClick={() => save(a.handle)}
                    disabled={isPending}
                    className="rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-3 py-1.5 text-sm disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>

                <div
                  onMouseDown={(e) => startRowResize(e, a.handle)}
                  className="absolute bottom-0 left-0 w-full h-1.5 cursor-row-resize hover:bg-blue-400/50"
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
