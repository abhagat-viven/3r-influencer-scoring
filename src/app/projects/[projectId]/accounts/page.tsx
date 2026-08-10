import { listAccounts, getSettings } from "@/db/queries";
import { parseBands } from "@/lib/scoring";
import AccountsTable from "@/components/AccountsTable";

export const dynamic = "force-dynamic";

export default async function AccountsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const accounts = await listAccounts(projectId, { candidatesOnly: true });
  const settings = await getSettings(projectId);
  const reachBands = parseBands(settings.reach_bands);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Accounts</h1>
        <p className="text-ink-soft mt-1">
          Candidate shortlist ranked by composite 3R score. Click a column to sort; edit
          Relevance or status inline.
        </p>
      </div>
      <AccountsTable projectId={projectId} accounts={accounts} reachBands={reachBands} />
    </div>
  );
}
