import { listAccounts } from "@/db/queries";
import { isClaudeConfigured } from "@/lib/relevance";
import PipelineRunner from "@/components/PipelineRunner";
import ExportCsvButton from "@/components/ExportCsvButton";

export const dynamic = "force-dynamic";

export default async function PipelinePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const candidates = listAccounts(projectId, { candidatesOnly: true });
  const notScraped = candidates.filter((c) => c.scrape_status === "not_scraped");
  const needsRelevance = candidates.filter(
    (c) => c.scrape_status === "scraped" && c.relevance_score == null
  );

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pipeline</h1>
          <p className="text-zinc-500 mt-1">
            Scrape follower counts + recent-post engagement via Apify, then score Relevance
            against your brand statement and ICP.
          </p>
        </div>
        <ExportCsvButton projectId={projectId} />
      </div>

      <PipelineRunner
        projectId={projectId}
        notScraped={notScraped}
        needsRelevance={needsRelevance}
        claudeConfigured={isClaudeConfigured()}
      />
    </div>
  );
}
