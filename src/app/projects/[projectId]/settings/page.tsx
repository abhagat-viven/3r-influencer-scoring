import { getSettings, listAccounts, getApiKeys } from "@/db/queries";
import BrandIcpForm from "@/components/BrandIcpForm";
import ScoringSettingsForm from "@/components/ScoringSettingsForm";
import ApiKeysForm from "@/components/ApiKeysForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const settings = getSettings(projectId);
  const candidateCount = listAccounts(projectId, { candidatesOnly: true }).length;
  const apiKeys = getApiKeys();
  const apifyConnected = Boolean(apiKeys.apify_api_token || process.env.APIFY_API_TOKEN);
  const anthropicConnected = Boolean(apiKeys.anthropic_api_key || process.env.ANTHROPIC_API_KEY);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-zinc-500 mt-1">
          Three sections: Brand &amp; ICP (drives Relevance), 3R Scoring (Reach/Resonance
          thresholds + composite weights), and API Keys (Apify + Anthropic).
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">1. Brand &amp; ICP</h2>
        <BrandIcpForm projectId={projectId} settings={settings} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">2. 3R Scoring</h2>
        <ScoringSettingsForm projectId={projectId} settings={settings} candidateCount={candidateCount} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">3. API Keys</h2>
        <ApiKeysForm apifyConnected={apifyConnected} anthropicConnected={anthropicConnected} />
      </section>
    </div>
  );
}
