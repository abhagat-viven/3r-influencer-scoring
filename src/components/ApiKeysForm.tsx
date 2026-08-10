"use client";

import { useState, useTransition } from "react";
import { saveApiKeys } from "@/app/actions";

function ConnectedBadge({ connected }: { connected: boolean }) {
  return connected ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-success-ink bg-success-soft rounded-full px-2 py-0.5">
      ✓ Connected
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-soft bg-surface-muted rounded-full px-2 py-0.5">
      Not connected
    </span>
  );
}

function KeyRow({
  label,
  helpText,
  connected,
  onSave,
}: {
  label: string;
  helpText: string;
  connected: boolean;
  onSave: (value: string) => Promise<{ ok: boolean; username?: string; error?: string } | undefined>;
}) {
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; username?: string; error?: string } | null>(
    null
  );

  function save() {
    if (!value.trim()) return;
    setResult(null);
    startTransition(async () => {
      const res = await onSave(value.trim());
      setResult(res ?? null);
      setValue("");
    });
  }

  return (
    <div className="border-b border-line last:border-b-0 py-4 first:pt-0 last:pb-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-medium text-ink">{label}</span>
        <ConnectedBadge connected={connected} />
      </div>
      <p className="text-xs text-ink-soft mb-2">{helpText}</p>
      <div className="flex items-center gap-2">
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={connected ? "Enter a new value to replace the current one" : "Paste your key/token"}
          className="flex-1 text-sm rounded-md border border-line bg-surface px-3 py-1.5 text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        />
        <button
          onClick={save}
          disabled={isPending || !value.trim()}
          className="rounded-md bg-primary hover:bg-primary-hover text-white px-3 py-1.5 text-sm font-medium disabled:opacity-50 disabled:hover:bg-primary transition-colors"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
      {result && (
        <p className={`text-xs mt-2 ${result.ok ? "text-success-ink" : "text-danger"}`}>
          {result.ok
            ? `✓ Verified${result.username ? ` — connected as ${result.username}` : ""}`
            : `✗ Couldn't verify: ${result.error}`}
        </p>
      )}
    </div>
  );
}

export default function ApiKeysForm({
  apifyConnected,
  anthropicConnected,
}: {
  apifyConnected: boolean;
  anthropicConnected: boolean;
}) {
  const [apify, setApify] = useState(apifyConnected);
  const [anthropic, setAnthropic] = useState(anthropicConnected);

  return (
    <div className="rounded-card border border-line bg-surface shadow-card p-6">
      <KeyRow
        label="Apify API token"
        helpText="Used for the Pipeline scrape step (follower counts, bios, recent posts). Get one at console.apify.com."
        connected={apify}
        onSave={async (v) => {
          const res = await saveApiKeys({ apifyApiToken: v });
          if (res.apify?.ok) setApify(true);
          return res.apify;
        }}
      />
      <KeyRow
        label="Anthropic API key"
        helpText="Used for the 'Auto-score with Claude' relevance button. Without it, relevance scoring stays manual. Get one at console.anthropic.com."
        connected={anthropic}
        onSave={async (v) => {
          const res = await saveApiKeys({ anthropicApiKey: v });
          if (res.anthropic?.ok) setAnthropic(true);
          return res.anthropic;
        }}
      />
      <p className="text-xs text-ink-soft mt-4">
        Keys are tied to your account, not this project — shared across every project you create,
        and take effect immediately with no server restart needed. They're never displayed back
        once saved; leave a field blank to keep the current value. A key set here overrides one in{" "}
        <code>.env</code>, and each save runs a lightweight live check (free/negligible cost) so a
        typo shows up right away.
      </p>
    </div>
  );
}
