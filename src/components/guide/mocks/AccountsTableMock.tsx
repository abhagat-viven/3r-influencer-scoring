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
    <div className="rounded-card border border-line bg-surface shadow-card overflow-x-auto pointer-events-none select-none">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-ink-soft border-b border-line">
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
            <tr key={r.handle} className="border-b border-line last:border-b-0">
              <td className="py-2 px-3 font-medium text-ink">{r.handle}</td>
              <td className="py-2 px-3 text-ink">{r.followers}</td>
              <td className="py-2 px-3 text-ink">{r.reach}</td>
              <td className="py-2 px-3 text-ink">
                {r.resonance}
                {r.stale && (
                  <span className="text-warning" title="Stale — no posts in the last 90 days">
                    {" "}⚠
                  </span>
                )}
              </td>
              <td className="py-2 px-3 text-ink">{r.relevance}</td>
              <td className="py-2 px-3">
                <span className="inline-flex items-center rounded-full bg-primary-soft text-primary-soft-ink font-semibold px-2 py-0.5">
                  {r.composite.toFixed(2)}
                </span>
              </td>
              <td className="py-2 px-3">
                <span className="text-xs rounded-full px-2 py-0.5 bg-surface-muted text-ink-soft">
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
