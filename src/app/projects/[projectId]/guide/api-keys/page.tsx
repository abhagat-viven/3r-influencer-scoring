import { DocHeader, PrevNext } from "@/components/guide/DocBits";

export default async function ApiKeysGuidePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const base = `/projects/${projectId}/guide`;

  return (
    <div>
      <DocHeader
        title="Bring your own API keys"
        description="Optional. Use your own Apify and Anthropic accounts instead of the app's default."
      />

      <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-4">
        <p>
          Set from the API Keys section in Settings, but shared across this whole local
          instance rather than scoped to any one project — a key you add carries over to every
          project you create.
        </p>
        <ul className="list-disc list-inside space-y-1.5">
          <li>
            <strong>Apify token</strong> — powers the Pipeline&apos;s scrape step (followers, bio,
            recent posts). Get one at <span className="font-mono text-xs">console.apify.com</span>.
          </li>
          <li>
            <strong>Anthropic key</strong> — powers &quot;Auto-score with Claude&quot; for
            Relevance. Without it, Relevance stays a manual score you set per account.
          </li>
        </ul>
        <p>
          A key you save overrides the app&apos;s default immediately, with no restart needed, and
          takes effect on the very next scrape or scoring run. It&apos;s never displayed again
          once saved — enter a new value to replace it, or leave the field blank to keep the
          current one.
        </p>
      </div>

      <PrevNext prev={{ href: `${base}/settings`, label: "Settings" }} />
    </div>
  );
}
