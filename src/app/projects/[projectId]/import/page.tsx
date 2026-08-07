import { listAccounts } from "@/db/queries";
import { getDb } from "@/db";
import ImportUploader from "@/components/ImportUploader";
import CandidateShortlist from "@/components/CandidateShortlist";

export const dynamic = "force-dynamic";

export default async function ImportPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const db = getDb();
  const total = (
    db.prepare("SELECT COUNT(*) as c FROM accounts WHERE project_id = ?").get(projectId) as {
      c: number;
    }
  ).c;
  const candidates = listAccounts(projectId, { candidatesOnly: true });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Import</h1>
        <p className="text-zinc-500 mt-1">
          Upload your Instagram &quot;following&quot; data export, then review the
          keyword-flagged candidate shortlist before scraping.
        </p>
      </div>

      <ImportUploader projectId={projectId} currentTotal={total} />

      {candidates.length > 0 && (
        <CandidateShortlist projectId={projectId} candidates={candidates} />
      )}
    </div>
  );
}
