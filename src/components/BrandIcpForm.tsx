"use client";

import { useState, useTransition } from "react";
import {
  updateSettingsAction,
  estimateRelevanceRescoreImpact,
  rescoreAllRelevance,
} from "@/app/actions";
import type { Settings } from "@/lib/types";

export default function BrandIcpForm({
  projectId,
  settings,
}: {
  projectId: string;
  settings: Settings;
}) {
  const [brandStatement, setBrandStatement] = useState(settings.brand_statement);
  const [icp, setIcp] = useState(settings.icp);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [alsoRescore, setAlsoRescore] = useState(false);
  const [impact, setImpact] = useState<{
    accountCount: number;
    estimatedCostUsd: number;
    claudeConfigured: boolean;
  } | null>(null);

  const changed = brandStatement !== settings.brand_statement || icp !== settings.icp;

  function save() {
    setSaved(false);
    if (!changed) return;
    startTransition(async () => {
      setImpact(await estimateRelevanceRescoreImpact(projectId));
      setReviewing(true);
    });
  }

  function confirmSave() {
    startTransition(async () => {
      await updateSettingsAction(projectId, { brand_statement: brandStatement, icp });
      if (alsoRescore) await rescoreAllRelevance(projectId);
      setReviewing(false);
      setAlsoRescore(false);
      setSaved(true);
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-card border border-line bg-surface shadow-card p-6 space-y-6">
        <div>
          <label className="text-sm font-medium text-ink block mb-2">Brand statement</label>
          <textarea
            value={brandStatement}
            onChange={(e) => setBrandStatement(e.target.value)}
            rows={4}
            placeholder="What does your product do, and what's the one-liner you'd want a creator to understand?"
            className="w-full text-sm rounded-md border border-line bg-surface text-ink placeholder:text-ink-faint px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-ink block mb-2">ICP (ideal customer profile)</label>
          <textarea
            value={icp}
            onChange={(e) => setIcp(e.target.value)}
            rows={4}
            placeholder="Who are you targeting? Personas, industries, audience traits a relevant creator's followers should match."
            className="w-full text-sm rounded-md border border-line bg-surface text-ink placeholder:text-ink-faint px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />
          <p className="text-xs text-ink-soft mt-2">
            Drives Relevance scoring. Changing this does NOT auto-rescore existing accounts —
            re-judging them needs either a Claude call (real cost) or manual review, so it's
            always an explicit opt-in after saving, never automatic.
          </p>
        </div>

        {!reviewing && (
          <div className="flex items-center gap-3">
            <button
              onClick={save}
              disabled={isPending || !changed}
              className="rounded-md bg-primary hover:bg-primary-hover text-white px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:hover:bg-primary transition-colors"
            >
              {isPending ? "Checking…" : "Review & save"}
            </button>
            {saved && <span className="text-sm text-success-ink">Saved.</span>}
          </div>
        )}
      </div>

      {reviewing && impact && (
        <div className="rounded-card border border-line border-l-4 border-l-primary bg-surface-muted shadow-card p-6 space-y-4">
          <h3 className="font-medium text-ink">Before you save</h3>
          <p className="text-sm text-ink-soft">
            {impact.accountCount} account(s) already have a Relevance score computed under the{" "}
            <em>old</em> brand statement/ICP. Saving will <strong>not</strong> automatically
            change those scores.
          </p>
          {impact.accountCount > 0 &&
            (impact.claudeConfigured ? (
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={alsoRescore}
                  onChange={(e) => setAlsoRescore(e.target.checked)}
                  className="accent-primary"
                />
                <span>
                  Also re-score Relevance for these {impact.accountCount} account(s) now — calls
                  the Anthropic API once per account, est.{" "}
                  <strong>${impact.estimatedCostUsd.toFixed(2)}</strong>
                </span>
              </label>
            ) : (
              <p className="text-sm text-warning-ink">
                No Anthropic API key configured (see the API Keys section below) — you&apos;ll
                need to manually re-review these {impact.accountCount} account(s) in the Accounts
                table against the new criteria.
              </p>
            ))}
          <div className="flex items-center gap-3">
            <button
              onClick={confirmSave}
              disabled={isPending}
              className="rounded-md bg-primary hover:bg-primary-hover text-white px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:hover:bg-primary transition-colors"
            >
              {isPending ? "Saving…" : "Confirm & save"}
            </button>
            <button
              onClick={() => setReviewing(false)}
              disabled={isPending}
              className="text-sm text-ink-soft hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
