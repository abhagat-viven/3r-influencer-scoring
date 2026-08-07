export function ImportMock() {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4 pointer-events-none select-none">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium">Following export</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Instagram → Settings → Accounts Center → Your information and permissions →
            Export your information → select &quot;Following&quot; only, JSON format.
          </p>
        </div>
        <span className="text-sm text-zinc-500 whitespace-nowrap">1,583 currently imported</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-3 py-1.5 text-sm">
          Choose File
        </span>
        <span className="text-sm text-zinc-500">following.json</span>
      </div>

      <p className="text-sm text-green-700 dark:text-green-400">
        Imported 1,583 accounts — 62 flagged as candidates by keyword match.
      </p>
    </div>
  );
}
