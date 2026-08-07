import { getApiKeys } from "@/db/queries";

// Relevance scoring against the brand statement / ICP. Falls back to manual
// entry in the UI whenever no Anthropic key is configured (neither in
// Settings nor .env) — scoreRelevanceWithClaude activates automatically the
// moment a key is present, no other code changes needed.

export const CLAUDE_MODEL = "claude-sonnet-4-5-20250929";

// Rough estimate for a relevance-scoring call on Sonnet 4.5 ($3/$15 per MTok):
// ~500-700 input tokens (system prompt + brand statement/ICP + bio) and ~80
// output tokens (the JSON score+rationale) works out to roughly $0.002-0.003.
// Rounded up slightly for headroom — this is an estimate, not a live quote.
export const RELEVANCE_COST_PER_ACCOUNT_USD = 0.003;

// A key saved in Settings takes precedence over .env — Settings changes take
// effect immediately, whereas .env is only read once at process start.
// Shared across every project — one local instance, one Anthropic account.
export function resolveAnthropicKey(): string | undefined {
  const fromDb = getApiKeys().anthropic_api_key;
  return fromDb || process.env.ANTHROPIC_API_KEY;
}

export function isClaudeConfigured(): boolean {
  return Boolean(resolveAnthropicKey());
}

export type RelevanceInput = {
  handle: string;
  bio: string;
  sampleCaptions: string[];
  brandStatement: string;
  icp: string;
};

export type RelevanceResult = {
  score: number;
  rationale: string;
};

const SYSTEM_PROMPT = `You score Instagram creators for relevance to a brand's influencer marketing campaign.
Given the brand's positioning statement, its ICP, and a creator's bio + recent post captions, output a
relevance score from 1 (irrelevant) to 5 (ideal fit) and a one-sentence rationale.
Respond with ONLY a JSON object: {"score": <1-5 integer>, "rationale": "<one sentence>"}`;

export async function scoreRelevanceWithClaude(
  input: RelevanceInput
): Promise<RelevanceResult> {
  const apiKey = resolveAnthropicKey();
  if (!apiKey) {
    throw new Error(
      "No Anthropic API key configured — add one in Settings, or use manual relevance entry."
    );
  }

  const userMessage = [
    `BRAND STATEMENT:\n${input.brandStatement}`,
    `ICP:\n${input.icp}`,
    `CREATOR HANDLE: @${input.handle}`,
    `BIO: ${input.bio}`,
    `SAMPLE CAPTIONS:\n${input.sampleCaptions.map((c) => `- ${c}`).join("\n")}`,
  ].join("\n\n");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude request failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? "{}";
  const parsed = JSON.parse(text) as RelevanceResult;
  return parsed;
}

export type AnthropicVerifyResult = { ok: boolean; error?: string };

// Uses the token-counting endpoint to validate a key right after it's saved —
// it doesn't generate a response, so cost is negligible, unlike a real
// relevance-scoring call.
export async function verifyAnthropicKey(): Promise<AnthropicVerifyResult> {
  const apiKey = resolveAnthropicKey();
  if (!apiKey) return { ok: false, error: "No key configured" };
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages/count_tokens", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        messages: [{ role: "user", content: "ping" }],
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
