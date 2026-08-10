import { DocHeader, PrevNext } from "@/components/guide/DocBits";

export default async function SettingsGuidePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const base = `/projects/${projectId}/guide`;

  return (
    <div>
      <DocHeader
        title="Settings"
        description="Brand & ICP, scoring weights, and API keys."
      />

      <div className="text-sm text-ink-soft leading-relaxed space-y-4">
        <p>Three sections, two of them scoped to the current project:</p>
        <ul className="list-disc list-inside space-y-1.5">
          <li>
            <strong>Brand &amp; ICP</strong> — the statement Claude uses to judge Relevance for
            this project&apos;s creators. Different projects can reuse the same statement or set
            their own.
          </li>
          <li>
            <strong>3R Scoring</strong> — the follower bands behind Reach, the engagement-rate
            bands behind Resonance, and the weights used to combine Reach/Resonance/Relevance into
            the composite score.
          </li>
          <li>
            <strong>API Keys</strong> — shared across this whole local instance, not scoped to
            this project. See{" "}
            <a href={`${base}/api-keys`} className="underline">
              Bring your own API keys
            </a>
            .
          </li>
        </ul>
        <p>
          Changing the 3R weights or bands recomputes scores for existing accounts immediately —
          there&apos;s no need to re-run Pipeline just to see the effect of a new weighting.
        </p>
      </div>

      <PrevNext
        prev={{ href: `${base}/accounts`, label: "Accounts" }}
        next={{ href: `${base}/api-keys`, label: "Bring your own API keys" }}
      />
    </div>
  );
}
