const ROWS = [
  {
    handle: "@creator.one",
    followers: "128K",
    reach: 4,
    resonance: 3,
    relevance: 5,
    composite: 4.1,
    status: "shortlisted",
  },
  {
    handle: "@creator.two",
    followers: "42K",
    reach: 3,
    resonance: 4,
    relevance: 3,
    composite: 3.3,
    status: "new",
  },
  {
    handle: "@creator.three",
    followers: "310K",
    reach: 5,
    resonance: 2,
    relevance: 4,
    composite: 3.7,
    status: "new",
    stale: true,
  },
];

export function AccountsTableMock() {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-x-auto pointer-events-none select-none">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
            <th className="py-2 px-3">Handle</th>
            <th className="py-2 px-3">Followers</th>
            <th className="py-2 px-3">Reach</th>
            <th className="py-2 px-3">Resonance</th>
            <th className="py-2 px-3">Relevance</th>
            <th className="py-2 px-3">Composite</th>
            <th className="py-2 px-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr
              key={r.handle}
              className="border-b border-zinc-100 dark:border-zinc-800/50 last:border-b-0"
            >
              <td className="py-2 px-3 font-medium">{r.handle}</td>
              <td className="py-2 px-3">{r.followers}</td>
              <td className="py-2 px-3">{r.reach}</td>
              <td className="py-2 px-3">
                {r.resonance}
                {r.stale && <span title="Stale — no posts in the last 90 days"> ⚠</span>}
              </td>
              <td className="py-2 px-3">{r.relevance}</td>
              <td className="py-2 px-3 font-medium">{r.composite.toFixed(2)}</td>
              <td className="py-2 px-3">
                <span className="text-xs rounded-full px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800">
                  {r.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
