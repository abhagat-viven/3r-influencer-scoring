"use client";

import { useMemo, useState, useTransition } from "react";
import { updateSettingsAction } from "@/app/actions";
import type { Settings, Band } from "@/lib/types";

const REACH_MAX_SENTINEL = 999999999;
const RESONANCE_MAX_SENTINEL = 999;

function bandThresholds(json: string): [number, number, number, number] {
  const bands = JSON.parse(json) as Band[];
  return [bands[0][0], bands[1][0], bands[2][0], bands[3][0]];
}

function buildBands(thresholds: [number, number, number, number], sentinel: number): Band[] {
  return [
    [thresholds[0], 1],
    [thresholds[1], 2],
    [thresholds[2], 3],
    [thresholds[3], 4],
    [sentinel, 5],
  ];
}

export default function ScoringSettingsForm({
  projectId,
  settings,
  candidateCount,
}: {
  projectId: string;
  settings: Settings;
  candidateCount: number;
}) {
  const [weightReach, setWeightReach] = useState(settings.weight_reach.toString());
  const [weightResonance, setWeightResonance] = useState(settings.weight_resonance.toString());
  const [weightRelevance, setWeightRelevance] = useState(settings.weight_relevance.toString());

  const initialReachT = useMemo(() => bandThresholds(settings.reach_bands), [settings.reach_bands]);
  const initialResonanceT = useMemo(
    () => bandThresholds(settings.resonance_bands).map((t) => t * 100) as [number, number, number, number],
    [settings.resonance_bands]
  );

  const [reachT, setReachT] = useState<[string, string, string, string]>(
    initialReachT.map(String) as [string, string, string, string]
  );
  const [resonanceT, setResonanceT] = useState<[string, string, string, string]>(
    initialResonanceT.map(String) as [string, string, string, string]
  );

  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const changed =
    reachT.some((v, i) => Number(v) !== initialReachT[i]) ||
    resonanceT.some((v, i) => Number(v) !== initialResonanceT[i]) ||
    Number(weightReach) !== settings.weight_reach ||
    Number(weightResonance) !== settings.weight_resonance ||
    Number(weightRelevance) !== settings.weight_relevance;

  function confirmSave() {
    startTransition(async () => {
      await updateSettingsAction(projectId, {
        weight_reach: Number(weightReach) || 1,
        weight_resonance: Number(weightResonance) || 1,
        weight_relevance: Number(weightRelevance) || 1,
        reach_bands: JSON.stringify(
          buildBands(reachT.map(Number) as [number, number, number, number], REACH_MAX_SENTINEL)
        ),
        resonance_bands: JSON.stringify(
          buildBands(
            resonanceT.map((v) => Number(v) / 100) as [number, number, number, number],
            RESONANCE_MAX_SENTINEL
          )
        ),
      });
      setReviewing(false);
      setSaved(true);
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-card border border-line bg-surface shadow-card p-6 space-y-6">
        <div>
          <label className="text-sm font-medium text-ink block mb-2">Reach thresholds (followers)</label>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-xs text-ink-soft">Score 1: &lt;</span>
            <input
              type="number"
              value={reachT[0]}
              onChange={(e) => setReachT([e.target.value, reachT[1], reachT[2], reachT[3]])}
              className="w-24 rounded-md border border-line bg-surface text-ink px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
            <span className="text-xs text-ink-soft">2: &lt;</span>
            <input
              type="number"
              value={reachT[1]}
              onChange={(e) => setReachT([reachT[0], e.target.value, reachT[2], reachT[3]])}
              className="w-24 rounded-md border border-line bg-surface text-ink px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
            <span className="text-xs text-ink-soft">3: &lt;</span>
            <input
              type="number"
              value={reachT[2]}
              onChange={(e) => setReachT([reachT[0], reachT[1], e.target.value, reachT[3]])}
              className="w-24 rounded-md border border-line bg-surface text-ink px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
            <span className="text-xs text-ink-soft">4: &lt;</span>
            <input
              type="number"
              value={reachT[3]}
              onChange={(e) => setReachT([reachT[0], reachT[1], reachT[2], e.target.value])}
              className="w-24 rounded-md border border-line bg-surface text-ink px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
            <span className="text-xs text-ink-soft">Score 5: above that</span>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-2">
            Resonance thresholds (median engagement rate, %)
          </label>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-xs text-ink-soft">Score 1: &lt;</span>
            <input
              type="number"
              step="0.1"
              value={resonanceT[0]}
              onChange={(e) =>
                setResonanceT([e.target.value, resonanceT[1], resonanceT[2], resonanceT[3]])
              }
              className="w-20 rounded-md border border-line bg-surface text-ink px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
            <span className="text-xs text-ink-soft">%  2: &lt;</span>
            <input
              type="number"
              step="0.1"
              value={resonanceT[1]}
              onChange={(e) =>
                setResonanceT([resonanceT[0], e.target.value, resonanceT[2], resonanceT[3]])
              }
              className="w-20 rounded-md border border-line bg-surface text-ink px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
            <span className="text-xs text-ink-soft">%  3: &lt;</span>
            <input
              type="number"
              step="0.1"
              value={resonanceT[2]}
              onChange={(e) =>
                setResonanceT([resonanceT[0], resonanceT[1], e.target.value, resonanceT[3]])
              }
              className="w-20 rounded-md border border-line bg-surface text-ink px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
            <span className="text-xs text-ink-soft">%  4: &lt;</span>
            <input
              type="number"
              step="0.1"
              value={resonanceT[3]}
              onChange={(e) =>
                setResonanceT([resonanceT[0], resonanceT[1], resonanceT[2], e.target.value])
              }
              className="w-20 rounded-md border border-line bg-surface text-ink px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
            <span className="text-xs text-ink-soft">%  Score 5: above that</span>
          </div>
          <p className="text-xs text-ink-soft mt-2">
            Median (not mean) likes+comments ÷ followers over recent posts — median resists
            distortion from a single viral Reel.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium block mb-2">Composite weights</label>
          <div className="flex gap-4">
            <div>
              <label className="text-xs text-ink-soft block mb-1">Reach</label>
              <input
                type="number"
                step="0.1"
                value={weightReach}
                onChange={(e) => setWeightReach(e.target.value)}
                className="w-20 text-sm rounded-md border border-line bg-surface text-ink px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              />
            </div>
            <div>
              <label className="text-xs text-ink-soft block mb-1">Resonance</label>
              <input
                type="number"
                step="0.1"
                value={weightResonance}
                onChange={(e) => setWeightResonance(e.target.value)}
                className="w-20 text-sm rounded-md border border-line bg-surface text-ink px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              />
            </div>
            <div>
              <label className="text-xs text-ink-soft block mb-1">Relevance</label>
              <input
                type="number"
                step="0.1"
                value={weightRelevance}
                onChange={(e) => setWeightRelevance(e.target.value)}
                className="w-20 text-sm rounded-md border border-line bg-surface text-ink px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              />
            </div>
          </div>
          <p className="text-xs text-ink-soft mt-2">Equal weights (1/1/1) give a simple average.</p>
        </div>

        {!reviewing && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setReviewing(true)}
              disabled={isPending || !changed}
              className="rounded-md bg-primary hover:bg-primary-hover text-white px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:hover:bg-primary transition-colors"
            >
              Review & save
            </button>
            {saved && <span className="text-sm text-success-ink">Saved.</span>}
          </div>
        )}
      </div>

      {reviewing && (
        <div className="rounded-card border border-line border-l-4 border-l-primary bg-surface-muted shadow-card p-6 space-y-4">
          <h3 className="font-medium text-ink">Before you save</h3>
          <p className="text-sm text-ink-soft">
            {candidateCount} candidate(s) will be re-scored (Reach, Resonance, Composite) using
            the new thresholds/weights. This is a local recalculation from data already in your
            database — <strong>no external API calls, $0.00, instant.</strong>
          </p>
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
