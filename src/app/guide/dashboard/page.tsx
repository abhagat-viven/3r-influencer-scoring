import { DocHeader, PrevNext } from "@/components/guide/DocBits";

const base = "/guide";

export default function DashboardGuidePage() {
  return (
    <div>
      <DocHeader
        title="Dashboard"
        description="The project's landing page — a quick read on how far along scoring is."
      />

      <div className="text-sm text-ink-soft leading-relaxed space-y-4">
        <p>
          The Dashboard is what you land on when you open a project. It shows a handful of counts:
        </p>
        <ul className="list-disc list-inside space-y-1.5">
          <li>How many accounts are imported in total.</li>
          <li>How many have been scraped (have followers/bio/post data from Apify).</li>
          <li>How many candidates have a Relevance score set.</li>
        </ul>
        <p>
          There&apos;s no action to take here — it&apos;s a status check to tell you whether the
          next step is Import, Pipeline, or straight to Accounts.
        </p>
      </div>

      <PrevNext
        prev={{ href: `${base}/getting-started`, label: "Getting started" }}
        next={{ href: `${base}/import`, label: "Import" }}
      />
    </div>
  );
}
