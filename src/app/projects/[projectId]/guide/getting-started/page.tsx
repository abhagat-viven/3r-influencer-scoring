import { DocHeader, Callout, PrevNext } from "@/components/guide/DocBits";

export default async function GettingStartedPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const base = `/projects/${projectId}/guide`;

  return (
    <div>
      <DocHeader
        title="Getting started"
        description="How a project goes from an empty list of handles to a ranked, scored shortlist."
      />

      <div className="text-sm text-ink-soft leading-relaxed space-y-4">
        <p>
          Each campaign or client list lives in its own <strong>project</strong>. A project has
          its own accounts, its own Brand &amp; ICP statement, and its own 3R scoring settings —
          nothing is shared between projects except your API keys.
        </p>

        <p>To take a project from nothing to a ranked shortlist:</p>
        <ol className="list-decimal list-inside space-y-1.5">
          <li>Create a project from the switcher at the top of the page.</li>
          <li>
            Go to <strong>Import</strong> and upload a creator list (a following export, CSV, or
            a rate card).
          </li>
          <li>
            In <strong>Settings</strong>, set your Brand &amp; ICP statement and, optionally, add
            your own API keys.
          </li>
          <li>
            Run <strong>Pipeline</strong> to scrape and score everyone you imported.
          </li>
          <li>
            Review results in <strong>Accounts</strong>, mark candidates, and export a shortlist.
          </li>
        </ol>

        <Callout>
          You don&apos;t need your own API keys to try this out — the app falls back to a shared
          default if you haven&apos;t configured your own. See{" "}
          <a href={`${base}/api-keys`} className="underline">
            Bring your own API keys
          </a>
          .
        </Callout>

        <p>
          The rest of this guide covers each tab in the project nav in more depth — what it&apos;s
          for, and what happens when you use it.
        </p>
      </div>

      <PrevNext next={{ href: `${base}/dashboard`, label: "Dashboard" }} />
    </div>
  );
}
