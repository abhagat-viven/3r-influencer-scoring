"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { updateAccountStatus, updateRelevanceManual } from "@/app/actions";
import type { Account, Band } from "@/lib/types";

type SortKey = "followers" | "reach_score" | "resonance_score" | "relevance_score" | "composite_score";

const STATUS_OPTIONS = ["new", "contacted", "negotiating", "booked", "rejected", "excluded"];

function fmt(v: number | null, decimals = 0): string {
  if (v == null) return "—";
  return decimals ? v.toFixed(decimals) : v.toLocaleString();
}

function fmtCount(n: number): string {
  return n >= 1000 ? `${n / 1000}K` : `${n}`;
}

// Derives human-readable follower-range labels from the same bands used to score Reach,
// so the filter options always match whatever thresholds are actually configured.
function reachFilterOptions(bands: Band[]) {
  return bands.map(([threshold, score], i) => {
    const prev = i === 0 ? 0 : bands[i - 1][0];
    const isLast = i === bands.length - 1;
    const label = i === 0
      ? `< ${fmtCount(threshold)}`
      : isLast
        ? `${fmtCount(prev)}+`
        : `${fmtCount(prev)} – ${fmtCount(threshold)}`;
    return { score, label };
  });
}

export default function AccountsTable({
  projectId,
  accounts,
  reachBands,
}: {
  projectId: string;
  accounts: Account[];
  reachBands: Band[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [sortKey, setSortKey] = useState<SortKey>(
    () => (searchParams.get("sort") as SortKey | null) ?? "composite_score"
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">(
    () => (searchParams.get("dir") as "asc" | "desc" | null) ?? "desc"
  );
  const [followerFilters, setFollowerFilters] = useState<Set<number>>(() => {
    const raw = searchParams.get("followers");
    return raw ? new Set(raw.split(",").map(Number)) : new Set();
  });
  const [statusFilters, setStatusFilters] = useState<Set<string>>(() => {
    const raw = searchParams.get("status");
    return raw ? new Set(raw.split(",")) : new Set();
  });
  const [rows, setRows] = useState(accounts);
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<string | null>(null);
  const [editScore, setEditScore] = useState("");
  const [editRationale, setEditRationale] = useState("");
  const [openFilterMenu, setOpenFilterMenu] = useState<"followers" | "status" | null>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  const reachOptions = useMemo(() => reachFilterOptions(reachBands), [reachBands]);

  useEffect(() => {
    if (!openFilterMenu) return;
    function handleClickOutside(e: MouseEvent) {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setOpenFilterMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openFilterMenu]);

  // Keeps sort + filter state in the URL so it survives navigating away and back
  // (the table is a client component and would otherwise reset on remount).
  function syncUrl(next: {
    sort?: SortKey;
    dir?: "asc" | "desc";
    followers?: Set<number>;
    status?: Set<string>;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", next.sort ?? sortKey);
    params.set("dir", next.dir ?? sortDir);
    const followers = next.followers ?? followerFilters;
    if (followers.size > 0) {
      params.set("followers", Array.from(followers).sort((a, b) => a - b).join(","));
    } else {
      params.delete("followers");
    }
    const status = next.status ?? statusFilters;
    if (status.size > 0) {
      params.set("status", Array.from(status).sort().join(","));
    } else {
      params.delete("status");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function toggleRangeFilter(score: number) {
    const next = new Set(followerFilters);
    if (next.has(score)) next.delete(score);
    else next.add(score);
    setFollowerFilters(next);
    syncUrl({ followers: next });
  }

  function clearRangeFilters() {
    setFollowerFilters(new Set());
    syncUrl({ followers: new Set() });
  }

  function toggleStatusFilter(status: string) {
    const next = new Set(statusFilters);
    if (next.has(status)) next.delete(status);
    else next.add(status);
    setStatusFilters(next);
    syncUrl({ status: next });
  }

  function clearStatusFilters() {
    setStatusFilters(new Set());
    syncUrl({ status: new Set() });
  }

  const sorted = useMemo(() => {
    const filtered = rows
      .filter((r) => followerFilters.size === 0 || (r.reach_score != null && followerFilters.has(r.reach_score)))
      .filter((r) => statusFilters.size === 0 || statusFilters.has(r.status));
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = a[sortKey] ?? -1;
      const bv = b[sortKey] ?? -1;
      return sortDir === "desc" ? bv - av : av - bv;
    });
    return copy;
  }, [rows, sortKey, sortDir, followerFilters, statusFilters]);

  function toggleSort(key: SortKey) {
    const newDir = key === sortKey ? (sortDir === "desc" ? "asc" : "desc") : "desc";
    setSortKey(key);
    setSortDir(newDir);
    syncUrl({ sort: key, dir: newDir });
  }

  function changeStatus(handle: string, status: string) {
    setRows((prev) =>
      prev.map((r) => (r.handle === handle ? { ...r, status: status as Account["status"] } : r))
    );
    startTransition(() => {
      updateAccountStatus(projectId, handle, status);
    });
  }

  function startEdit(a: Account) {
    setEditing(a.handle);
    setEditScore(a.relevance_score?.toString() ?? "");
    setEditRationale(a.relevance_rationale ?? "");
  }

  function saveEdit(handle: string) {
    const score = Number(editScore);
    if (!score || score < 1 || score > 5) return;
    startTransition(async () => {
      await updateRelevanceManual(projectId, handle, score, editRationale);
      setRows((prev) =>
        prev.map((r) =>
          r.handle === handle
            ? {
                ...r,
                relevance_score: score,
                relevance_rationale: editRationale,
                composite_score:
                  r.reach_score != null && r.resonance_score != null
                    ? Math.round(((r.reach_score + r.resonance_score + score) / 3) * 100) / 100
                    : r.composite_score,
              }
            : r
        )
      );
      setEditing(null);
    });
  }

  const headers: Array<{ key: SortKey | null; label: string }> = [
    { key: null, label: "Handle" },
    { key: "followers", label: "Followers" },
    { key: "reach_score", label: "Reach" },
    { key: "resonance_score", label: "Resonance" },
    { key: "relevance_score", label: "Relevance" },
    { key: "composite_score", label: "Composite" },
    { key: null, label: "Status" },
  ];

  return (
    <div className="space-y-3">
      {(followerFilters.size > 0 || statusFilters.size > 0) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {followerFilters.size > 0 && (
            <span className="text-zinc-500">
              Followers:{" "}
              {reachOptions
                .filter((o) => followerFilters.has(o.score))
                .map((o) => o.label)
                .join(", ")}{" "}
              <button
                onClick={clearRangeFilters}
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 underline"
              >
                Clear
              </button>
            </span>
          )}
          {statusFilters.size > 0 && (
            <span className="text-zinc-500">
              Status: {Array.from(statusFilters).join(", ")}{" "}
              <button
                onClick={clearStatusFilters}
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 underline"
              >
                Clear
              </button>
            </span>
          )}
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
            {headers.map((h) =>
              h.key === "followers" ? (
                <th key={h.label} className="py-2 px-3 whitespace-nowrap relative">
                  <div className="flex items-center gap-1.5">
                    <span
                      onClick={() => toggleSort("followers")}
                      className="cursor-pointer select-none hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                      {h.label}
                      {sortKey === "followers" && (sortDir === "desc" ? " ↓" : " ↑")}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenFilterMenu((o) => (o === "followers" ? null : "followers"));
                      }}
                      className={`text-xs font-normal rounded border px-1.5 py-0.5 ${
                        followerFilters.size > 0
                          ? "border-blue-500 text-blue-600 dark:text-blue-400"
                          : "border-zinc-300 dark:border-zinc-700"
                      }`}
                    >
                      Filter{followerFilters.size > 0 ? ` (${followerFilters.size})` : ""} ▾
                    </button>
                  </div>

                  {openFilterMenu === "followers" && (
                    <div
                      ref={filterMenuRef}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute z-20 top-full left-3 mt-1 w-56 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg p-2 text-xs font-normal normal-case"
                    >
                      {reachOptions.map((opt) => (
                        <label
                          key={opt.score}
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={followerFilters.has(opt.score)}
                            onChange={() => toggleRangeFilter(opt.score)}
                          />
                          <span className="flex-1">{opt.label}</span>
                          <span className="text-zinc-400">
                            {rows.filter((r) => r.reach_score === opt.score).length}
                          </span>
                        </label>
                      ))}
                      <div className="border-t border-zinc-200 dark:border-zinc-800 mt-1 pt-1 flex justify-between">
                        <button
                          onClick={clearRangeFilters}
                          className="text-zinc-500 hover:underline"
                        >
                          Clear
                        </button>
                        <button
                          onClick={() => setOpenFilterMenu(null)}
                          className="text-zinc-900 dark:text-zinc-100 font-medium"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </th>
              ) : h.label === "Status" ? (
                <th key={h.label} className="py-2 px-3 whitespace-nowrap relative">
                  <div className="flex items-center gap-1.5">
                    <span>{h.label}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenFilterMenu((o) => (o === "status" ? null : "status"));
                      }}
                      className={`text-xs font-normal rounded border px-1.5 py-0.5 ${
                        statusFilters.size > 0
                          ? "border-blue-500 text-blue-600 dark:text-blue-400"
                          : "border-zinc-300 dark:border-zinc-700"
                      }`}
                    >
                      Filter{statusFilters.size > 0 ? ` (${statusFilters.size})` : ""} ▾
                    </button>
                  </div>

                  {openFilterMenu === "status" && (
                    <div
                      ref={filterMenuRef}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute z-20 top-full right-0 mt-1 w-48 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg p-2 text-xs font-normal normal-case"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <label
                          key={s}
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={statusFilters.has(s)}
                            onChange={() => toggleStatusFilter(s)}
                          />
                          <span className="flex-1">{s}</span>
                          <span className="text-zinc-400">
                            {rows.filter((r) => r.status === s).length}
                          </span>
                        </label>
                      ))}
                      <div className="border-t border-zinc-200 dark:border-zinc-800 mt-1 pt-1 flex justify-between">
                        <button
                          onClick={clearStatusFilters}
                          className="text-zinc-500 hover:underline"
                        >
                          Clear
                        </button>
                        <button
                          onClick={() => setOpenFilterMenu(null)}
                          className="text-zinc-900 dark:text-zinc-100 font-medium"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </th>
              ) : (
                <th
                  key={h.label}
                  onClick={() => h.key && toggleSort(h.key)}
                  className={`py-2 px-3 whitespace-nowrap ${h.key ? "cursor-pointer select-none hover:text-zinc-900 dark:hover:text-zinc-100" : ""}`}
                >
                  {h.label}
                  {h.key === sortKey && (sortDir === "desc" ? " ↓" : " ↑")}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {sorted.map((a) => (
            <tr key={a.handle} className="border-b border-zinc-100 dark:border-zinc-800/50 align-top">
              <td className="py-2 px-3">
                <div className="flex items-center gap-2">
                  <a
                    href={a.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    @{a.handle}
                  </a>
                  <a
                    href={a.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                  >
                    {a.link}
                  </a>
                  {a.is_private === 1 && (
                    <span className="text-xs text-zinc-400">(private)</span>
                  )}
                </div>
              </td>
              <td className="py-2 px-3">{fmt(a.followers)}</td>
              <td className="py-2 px-3">{fmt(a.reach_score)}</td>
              <td className="py-2 px-3">
                {fmt(a.resonance_score)}
                {a.resonance_score != null && a.resonance_stale === 1 && (
                  <span
                    className="ml-1 text-amber-600 dark:text-amber-400"
                    title="No posts within the last 90 days — this score is based on older content, not current performance."
                  >
                    ⚠
                  </span>
                )}
              </td>
              <td className="py-2 px-3">
                {editing === a.handle ? (
                  <div className="flex flex-col gap-1 min-w-48">
                    <select
                      value={editScore}
                      onChange={(e) => setEditScore(e.target.value)}
                      className="w-20 text-sm rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-1.5 py-0.5"
                    >
                      <option value="">Score</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                    </select>
                    <textarea
                      value={editRationale}
                      onChange={(e) => setEditRationale(e.target.value)}
                      rows={2}
                      className="text-sm rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-1.5 py-0.5"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(a.handle)}
                        className="text-xs rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-2 py-1"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="text-xs rounded border border-zinc-300 dark:border-zinc-700 px-2 py-1"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(a)}
                    className="text-left hover:underline decoration-dotted"
                    title={a.relevance_rationale ?? "Click to set"}
                  >
                    {fmt(a.relevance_score)}
                  </button>
                )}
              </td>
              <td className="py-2 px-3 font-medium">{fmt(a.composite_score, 2)}</td>
              <td className="py-2 px-3">
                <select
                  value={a.status}
                  onChange={(e) => changeStatus(a.handle, e.target.value)}
                  className="text-sm rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-1.5 py-0.5"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
