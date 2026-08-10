import { DocHeader, Callout, PrevNext } from "@/components/guide/DocBits";

export default async function PipelineGuidePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const base = `/projects/${projectId}/guide`;

  return (
    <div>
      <DocHeader
        title="Pipeline"
        description="Runs the actual scoring work — scrape, then Reach/Resonance/Relevance."
      />

      <div className="text-sm text-ink-soft leading-relaxed space-y-4">
        <p>Pipeline runs in two steps, and you can re-run either one independently:</p>

        <div className="space-y-2">
          <p className="font-medium text-ink">1. Scrape</p>
          <p>
            Pulls current follower count, bio, privacy status, and recent posts for each candidate
            via Apify, then computes:
          </p>
          <ul className="list-disc list-inside space-y-1.5">
            <li>
              <strong>Reach</strong> — a 1–5 score from follower count, using the bands set in
              Settings.
            </li>
            <li>
              <strong>Resonance</strong> — median engagement rate on posts from the last 90 days.
            </li>
          </ul>
          <p>
            An account with no posts inside that 90-day window still gets scored, using whatever
            posts are available, and is flagged with a ⚠ in the Accounts table as a stale
            Resonance reading.
          </p>
        </div>

        <div className="space-y-2">
          <p className="font-medium text-ink">2. Relevance</p>
          <p>
            Scored either manually per account in the Accounts table, or in bulk from Pipeline with{" "}
            <strong>&quot;Auto-score with Claude&quot;</strong>, which judges fit against your
            project&apos;s Brand &amp; ICP statement.
          </p>
        </div>

        <Callout>
          Scraping costs Apify credits and Claude scoring costs Anthropic usage — both only run on
          candidates, and only when you click the corresponding button. Nothing runs automatically
          in the background.
        </Callout>
      </div>

      <PrevNext
        prev={{ href: `${base}/import`, label: "Import" }}
        next={{ href: `${base}/scoring`, label: "How scoring works" }}
      />
    </div>
  );
}
