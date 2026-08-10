export function ImportMock() {
  return (
    <div className="rounded-card border border-line bg-surface shadow-card p-6 space-y-4 pointer-events-none select-none">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium text-ink">Following export</h2>
          <p className="text-sm text-ink-soft mt-1">
            Instagram → Settings → Accounts Center → Your information and permissions →
            Export your information → select &quot;Following&quot; only, JSON format.
          </p>
        </div>
        <span className="text-sm text-ink-soft whitespace-nowrap">1,583 currently imported</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="rounded-md bg-primary text-white px-3 py-1.5 text-sm">Choose File</span>
        <span className="text-sm text-ink-soft">following.json</span>
      </div>

      <p className="text-sm text-success-ink">
        Imported 1,583 accounts — 62 flagged as candidates by keyword match.
      </p>
    </div>
  );
}
