"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { updateAccountStatus, updateRelevanceManual } from "@/app/actions";
import { accountsToCsv } from "@/lib/csv";
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

type StoredFilters = {
  sort?: SortKey;
  dir?: "asc" | "desc";
  followers?: number[];
  status?: string[];
};

function storageKey(projectId: string): string {
  return `accounts-filters:${projectId}`;
}

// Reads the last-used filter/sort state for this project. Used as a fallback
// when the URL has none — e.g. after switching to another tab and back, since
// the project nav links to a bare path with no query string.
function loadStoredFilters(projectId: string): StoredFilters | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(projectId));
    return raw ? (JSON.parse(raw) as StoredFilters) : null;
  } catch {
    return null;
  }
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
  const stored = loadStoredFilters(projectId);

  const [sortKey, setSortKey] = useState<SortKey>(
    () => (searchParams.get("sort") as SortKey | null) ?? stored?.sort ?? "composite_score"
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">(
    () => (searchParams.get("dir") as "asc" | "desc" | null) ?? stored?.dir ?? "desc"
  );
  const [followerFilters, setFollowerFilters] = useState<Set<number>>(() => {
    const raw = searchParams.get("followers");
    if (raw) return new Set(raw.split(",").map(Number));
    return new Set(stored?.followers ?? []);
  });
  const [statusFilters, setStatusFilters] = useState<Set<string>>(() => {
    const raw = searchParams.get("status");
    if (raw) return new Set(raw.split(","));
    return new Set(stored?.status ?? []);
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

  // Keeps sort + filter state in both the URL (for shareable/bookmarkable links)
  // and localStorage (so it survives switching to another tab and back — the
  // project nav links to a bare path with no query string, so the URL alone
  // isn't enough once you've navigated away).
  function syncUrl(next: {
    sort?: SortKey;
    dir?: "asc" | "desc";
    followers?: Set<number>;
    status?: Set<string>;
  }) {
    const sort = next.sort ?? sortKey;
    const dir = next.dir ?? sortDir;
    const followers = next.followers ?? followerFilters;
    const status = next.status ?? statusFilters;

    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sort);
    params.set("dir", dir);
    if (followers.size > 0) {
      params.set("followers", Array.from(followers).sort((a, b) => a - b).join(","));
    } else {
      params.delete("followers");
    }
    if (status.size > 0) {
      params.set("status", Array.from(status).sort().join(","));
    } else {
      params.delete("status");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        storageKey(projectId),
        JSON.stringify({
          sort,
          dir,
          followers: Array.from(followers),
          status: Array.from(status),
        } satisfies StoredFilters)
      );
    }
  }

  // If we landed here with no query string but restored filters/sort from a
  // previous visit, reflect that back into the URL once so it's shareable —
  // otherwise the address bar silently disagrees with what's on screen.
  useEffect(() => {
    if (!searchParams.get("sort") && !searchParams.get("followers") && !searchParams.get("status")) {
      if (stored) syncUrl({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  function exportCsv() {
    const csv = accountsToCsv(sorted);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `influencer-candidates-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

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
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-soft">
          {sorted.length.toLocaleString()} account{sorted.length === 1 ? "" : "s"}
        </span>
        <button
          onClick={exportCsv}
          className="rounded-md border border-line text-ink hover:bg-surface-muted px-3 py-1.5 text-sm font-medium"
        >
          Export CSV
        </button>
      </div>

      {(followerFilters.size > 0 || statusFilters.size > 0) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {followerFilters.size > 0 && (
            <span className="text-ink-soft">
              Followers:{" "}
              {reachOptions
                .filter((o) => followerFilters.has(o.score))
                .map((o) => o.label)
                .join(", ")}{" "}
              <button onClick={clearRangeFilters} className="text-ink-soft hover:text-ink underline">
                Clear
              </button>
            </span>
          )}
          {statusFilters.size > 0 && (
            <span className="text-ink-soft">
              Status: {Array.from(statusFilters).join(", ")}{" "}
              <button onClick={clearStatusFilters} className="text-ink-soft hover:text-ink underline">
                Clear
              </button>
            </span>
          )}
        </div>
      )}

      <div className="rounded-card border border-line bg-surface shadow-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-ink-soft border-b border-line">
            {headers.map((h) =>
              h.key === "followers" ? (
                <th key={h.label} className="py-2 px-3 whitespace-nowrap relative">
                  <div className="flex items-center gap-1.5">
                    <span
                      onClick={() => toggleSort("followers")}
                      className="cursor-pointer select-none hover:text-ink"
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
                        followerFilters.size > 0 ? "border-primary text-primary" : "border-line"
                      }`}
                    >
                      Filter{followerFilters.size > 0 ? ` (${followerFilters.size})` : ""} ▾
                    </button>
                  </div>

                  {openFilterMenu === "followers" && (
                    <div
                      ref={filterMenuRef}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute z-20 top-full left-3 mt-1 w-56 rounded-md border border-line bg-surface shadow-lg p-2 text-xs font-normal normal-case"
                    >
                      {reachOptions.map((opt) => (
                        <label
                          key={opt.score}
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-muted cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={followerFilters.has(opt.score)}
                            onChange={() => toggleRangeFilter(opt.score)}
                            className="accent-primary"
                          />
                          <span className="flex-1 text-ink">{opt.label}</span>
                          <span className="text-ink-faint">
                            {rows.filter((r) => r.reach_score === opt.score).length}
                          </span>
                        </label>
                      ))}
                      <div className="border-t border-line mt-1 pt-1 flex justify-between">
                        <button onClick={clearRangeFilters} className="text-ink-soft hover:underline">
                          Clear
                        </button>
                        <button
                          onClick={() => setOpenFilterMenu(null)}
                          className="text-ink font-medium"
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
                        statusFilters.size > 0 ? "border-primary text-primary" : "border-line"
                      }`}
                    >
                      Filter{statusFilters.size > 0 ? ` (${statusFilters.size})` : ""} ▾
                    </button>
                  </div>

                  {openFilterMenu === "status" && (
                    <div
                      ref={filterMenuRef}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute z-20 top-full right-0 mt-1 w-48 rounded-md border border-line bg-surface shadow-lg p-2 text-xs font-normal normal-case"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <label
                          key={s}
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-muted cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={statusFilters.has(s)}
                            onChange={() => toggleStatusFilter(s)}
                            className="accent-primary"
                          />
                          <span className="flex-1 text-ink">{s}</span>
                          <span className="text-ink-faint">
                            {rows.filter((r) => r.status === s).length}
                          </span>
                        </label>
                      ))}
                      <div className="border-t border-line mt-1 pt-1 flex justify-between">
                        <button onClick={clearStatusFilters} className="text-ink-soft hover:underline">
                          Clear
                        </button>
                        <button
                          onClick={() => setOpenFilterMenu(null)}
                          className="text-ink font-medium"
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
                  className={`py-2 px-3 whitespace-nowrap ${h.key ? "cursor-pointer select-none hover:text-ink" : ""}`}
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
            <tr key={a.handle} className="border-b border-line align-top hover:bg-surface-muted">
              <td className="py-2 px-3">
                <div className="flex items-center gap-2">
                  <a
                    href={a.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    @{a.handle}
                  </a>
                  <a
                    href={a.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-ink-faint hover:text-primary hover:underline"
                  >
                    {a.link}
                  </a>
                  {a.is_private === 1 && <span className="text-xs text-ink-faint">(private)</span>}
                </div>
              </td>
              <td className="py-2 px-3 text-ink">{fmt(a.followers)}</td>
              <td className="py-2 px-3 text-ink">{fmt(a.reach_score)}</td>
              <td className="py-2 px-3 text-ink">
                {fmt(a.resonance_score)}
                {a.resonance_score != null && a.resonance_stale === 1 && (
                  <span
                    className="ml-1 text-warning"
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
                      className="w-20 text-sm rounded border border-line bg-surface text-ink px-1.5 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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
                      className="text-sm rounded border border-line bg-surface text-ink px-1.5 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(a.handle)}
                        className="text-xs rounded bg-primary hover:bg-primary-hover text-white px-2 py-1 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="text-xs rounded border border-line text-ink-soft hover:text-ink px-2 py-1"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(a)}
                    className="text-left text-ink hover:underline decoration-dotted"
                    title={a.relevance_rationale ?? "Click to set"}
                  >
                    {fmt(a.relevance_score)}
                  </button>
                )}
              </td>
              <td className="py-2 px-3">
                {a.composite_score != null ? (
                  <span className="inline-flex items-center rounded-full bg-primary-soft text-primary-soft-ink font-semibold px-2 py-0.5">
                    {fmt(a.composite_score, 2)}
                  </span>
                ) : (
                  <span className="text-ink-faint">—</span>
                )}
              </td>
              <td className="py-2 px-3">
                <select
                  value={a.status}
                  onChange={(e) => changeStatus(a.handle, e.target.value)}
                  className="text-sm rounded border border-line bg-surface text-ink px-1.5 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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
