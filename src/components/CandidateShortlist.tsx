"use client";

import { useState, useTransition } from "react";
import { setCandidate, searchNonCandidateAccounts } from "@/app/actions";
import type { Account } from "@/lib/types";

export default function CandidateShortlist({
  projectId,
  candidates,
}: {
  projectId: string;
  candidates: Account[];
}) {
  const [rows, setRows] = useState(candidates);
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ handle: string; link: string }>>([]);
  const [searching, setSearching] = useState(false);

  function remove(handle: string) {
    setRows((prev) => prev.filter((r) => r.handle !== handle));
    startTransition(() => {
      setCandidate(projectId, handle, false);
    });
  }

  function runSearch(q: string) {
    setQuery(q);
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    searchNonCandidateAccounts(projectId, q).then((res) => {
      setSearchResults(res);
      setSearching(false);
    });
  }

  function addFromSearch(handle: string, link: string) {
    setSearchResults((prev) => prev.filter((r) => r.handle !== handle));
    setRows((prev) => [
      ...prev,
      {
        project_id: projectId,
        handle,
        link,
        followed_timestamp: null,
        keyword_categories: "manual_add",
        is_candidate: 1,
        scrape_status: "not_scraped",
        followers: null,
        bio: null,
        is_private: 0,
        posts_analyzed: null,
        mean_eng_rate: null,
        median_eng_rate: null,
        reach_score: null,
        resonance_score: null,
        resonance_stale: 0,
        relevance_score: null,
        relevance_rationale: null,
        composite_score: null,
        status: "new",
        updated_at: null,
      },
    ]);
    startTransition(() => {
      setCandidate(projectId, handle, true);
    });
  }

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Candidate shortlist ({rows.length})</h2>
        <div className="relative">
          <input
            value={query}
            onChange={(e) => runSearch(e.target.value)}
            placeholder="Search full following list to add someone…"
            className="text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-1.5 w-72"
          />
          {searchResults.length > 0 && (
            <div className="absolute right-0 mt-1 w-72 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg z-10 max-h-64 overflow-y-auto">
              {searchResults.map((r) => (
                <button
                  key={r.handle}
                  onClick={() => addFromSearch(r.handle, r.link)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  @{r.handle}
                </button>
              ))}
            </div>
          )}
          {searching && (
            <div className="absolute right-0 mt-1 w-72 text-xs text-zinc-500 px-3">
              Searching…
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
              <th className="py-2 pr-4 w-8"></th>
              <th className="py-2 pr-4">Handle</th>
              <th className="py-2 pr-4">Category</th>
              <th className="py-2 pr-4">Followers</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.handle} className="border-b border-zinc-100 dark:border-zinc-800/50">
                <td className="py-2 pr-4">
                  <input
                    type="checkbox"
                    checked
                    onChange={() => remove(r.handle)}
                    title="Uncheck to remove from shortlist"
                  />
                </td>
                <td className="py-2 pr-4">
                  <a
                    href={r.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline mr-2"
                  >
                    @{r.handle}
                  </a>
                  <a
                    href={r.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                  >
                    {r.link}
                  </a>
                </td>
                <td className="py-2 pr-4 text-zinc-500">{r.keyword_categories}</td>
                <td className="py-2 pr-4 text-zinc-500">
                  {r.followers != null ? r.followers.toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
