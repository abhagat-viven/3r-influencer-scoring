import { DocHeader, MockFrame, PrevNext } from "@/components/guide/DocBits";
import { AccountsTableMock } from "@/components/guide/mocks/AccountsTableMock";

const base = "/guide";

export default function AccountsGuidePage() {
  return (
    <div>
      <DocHeader
        title="Accounts"
        description="The candidate shortlist, ranked by composite 3R score — where day-to-day review happens."
      />

      <div className="text-sm text-ink-soft leading-relaxed space-y-4">
        <p>
          Every candidate in the project, with Reach, Resonance, Relevance, and the composite
          score that combines all three using the weights set in Settings.
        </p>
      </div>

      <div className="mt-6">
        <MockFrame label="Preview — Accounts table">
          <AccountsTableMock />
        </MockFrame>
      </div>

      <div className="text-sm text-ink-soft leading-relaxed space-y-4 mt-6">
        <ul className="list-disc list-inside space-y-1.5">
          <li>Click a column header to sort by it.</li>
          <li>Filter by follower range or status using the small filter icons in each header.</li>
          <li>
            Edit Relevance or Status directly in the table — changes recompute the composite
            score immediately.
          </li>
          <li>A ⚠ next to Resonance means that score is based on stale data — see Pipeline.</li>
          <li>Export the current view to CSV once you&apos;ve settled on a shortlist.</li>
        </ul>
      </div>

      <PrevNext
        prev={{ href: `${base}/scoring`, label: "How scoring works" }}
        next={{ href: `${base}/settings`, label: "Settings" }}
      />
    </div>
  );
}
