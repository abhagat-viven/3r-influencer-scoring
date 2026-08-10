"use client";

import { useEffect, useState, useTransition } from "react";
import { runScrapeBatch, fetchApifyBudget } from "@/app/actions";
import type { Account } from "@/lib/types";
import type { ApifyBudget } from "@/lib/apify";
import RelevanceGrid from "@/components/RelevanceGrid";

const COST_PER_PROFILE_USD = 0.0026; // Apify free-tier price per dataset item (result)

export default function PipelineRunner({
  projectId,
  notScraped,
  needsRelevance,
  claudeConfigured,
}: {
  projectId: string;
  notScraped: Account[];
  needsRelevance: Account[];
  claudeConfigured: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(notScraped.map((a) => a.handle)));
  const [isPending, startTransition] = useTransition();
  const [scrapeResult, setScrapeResult] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [budget, setBudget] = useState<ApifyBudget | null>(null);
  const [budgetLoaded, setBudgetLoaded] = useState(false);

  useEffect(() => {
    fetchApifyBudget(projectId)
      .then(setBudget)
      .finally(() => setBudgetLoaded(true));
  }, [projectId]);

  const selectedCount = selected.size;
  const cost = Math.round(selectedCount * COST_PER_PROFILE_USD * 100) / 100;
  const overBudget = budget != null && cost > budget.remainingUsd;

  function toggle(handle: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(handle)) next.delete(handle);
      else next.add(handle);
      return next;
    });
    setConfirming(false);
  }

  function runScrape() {
    setScrapeResult(null);
    setConfirming(false);
    startTransition(async () => {
      const res = await runScrapeBatch(projectId, Array.from(selected));
      setScrapeResult(
        `Scraped ${res.scraped} profile(s).` +
          (res.errors.length ? ` Failed: ${res.errors.join(", ")}` : "")
      );
      fetchApifyBudget(projectId).then(setBudget);
    });
  }

  return (
    <div className="space-y-8">
      <section className="rounded-card border border-line bg-surface shadow-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-ink">
            Step 1 — Scrape ({notScraped.length} not yet scraped)
          </h2>
          <div className="text-sm text-ink-soft">
            {budgetLoaded ? (
              budget ? (
                <>
                  ${budget.spentUsd.toFixed(2)} spent / ${budget.planLimitUsd.toFixed(2)} plan ·{" "}
                  <span className={overBudget ? "text-danger font-medium" : ""}>
                    ${budget.remainingUsd.toFixed(2)} remaining
                  </span>
                </>
              ) : (
                <span className="text-warning">
                  Couldn&apos;t reach Apify to check remaining budget
                </span>
              )
            ) : (
              "Checking Apify budget…"
            )}
          </div>
        </div>

        {notScraped.length === 0 ? (
          <p className="text-sm text-ink-soft">All candidates have been scraped.</p>
        ) : (
          <>
            <div className="max-h-64 overflow-y-auto border border-line rounded-md">
              <table className="w-full text-sm">
                <tbody>
                  {notScraped.map((a) => (
                    <tr key={a.handle} className="border-b border-line hover:bg-surface-muted">
                      <td className="py-1.5 px-3 w-8">
                        <input
                          type="checkbox"
                          checked={selected.has(a.handle)}
                          onChange={() => toggle(a.handle)}
                          className="accent-primary"
                        />
                      </td>
                      <td className="py-1.5 px-3">
                        <span className="mr-2 text-ink">@{a.handle}</span>
                        <a
                          href={a.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          {a.link}
                        </a>
                      </td>
                      <td className="py-1.5 px-3 text-ink-soft">{a.keyword_categories}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-md border border-line bg-surface-muted px-4 py-3 flex items-center justify-between">
              <div className="text-sm text-ink">
                <span className="font-medium">{selectedCount} account(s) selected</span>
                <span className="text-ink-soft"> · estimated cost </span>
                <span className="font-medium">${cost.toFixed(2)}</span>
                <span className="text-ink-soft"> (${COST_PER_PROFILE_USD.toFixed(4)}/profile)</span>
              </div>
              {overBudget && (
                <span className="text-xs text-danger font-medium">Exceeds remaining budget</span>
              )}
            </div>

            {!confirming ? (
              <button
                onClick={() => setConfirming(true)}
                disabled={isPending || selectedCount === 0}
                className="rounded-md bg-primary hover:bg-primary-hover text-white px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:hover:bg-primary transition-colors"
              >
                Review &amp; run scrape on {selectedCount} account(s)
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={runScrape}
                  disabled={isPending}
                  className={`rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors ${
                    overBudget ? "bg-danger hover:bg-danger" : "bg-primary hover:bg-primary-hover"
                  }`}
                >
                  {isPending
                    ? "Scraping…"
                    : `Confirm: spend ~$${cost.toFixed(2)} on ${selectedCount} account(s)`}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  disabled={isPending}
                  className="text-sm text-ink-soft hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            )}
            {scrapeResult && <p className="text-sm text-ink-soft">{scrapeResult}</p>}
          </>
        )}
      </section>

      <RelevanceGrid
        projectId={projectId}
        needsRelevance={needsRelevance}
        claudeConfigured={claudeConfigured}
      />
    </div>
  );
}
