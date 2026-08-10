import { DocHeader, Callout, PrevNext } from "@/components/guide/DocBits";

const base = "/guide";

export default function ScoringGuidePage() {
  return (
    <div>
      <DocHeader
        title="How scoring works"
        description="The exact math behind Reach, Resonance, and Relevance, worked through with a fictional creator."
      />

      <div className="text-sm text-ink-soft leading-relaxed space-y-4">
        <p>
          Every score below is computed from real data — followers, post engagement, an
          Anthropic judgment — mapped onto a 1–5 scale using <strong>bands</strong> (Reach,
          Resonance) or a direct judgment (Relevance). The bands shown are this app&apos;s
          defaults; you can change the thresholds and weights in{" "}
          <strong>Settings → 3R Scoring</strong>, and every existing score recomputes instantly
          when you do.
        </p>
        <p>
          Throughout, we&apos;ll follow one fictional creator — <strong>@wanderlens_ari</strong>,
          a travel/remote-work micro-influencer — being scored for a fictional brand,{" "}
          <strong>Voyable</strong> (a same-day trip-booking app).
        </p>
      </div>

      {/* Reach */}
      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold text-ink">Reach</h2>
        <div className="text-sm text-ink-soft leading-relaxed space-y-3">
          <p>Follower count, bucketed into a 1–5 band. Nothing else factors in.</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-line rounded-md">
              <thead>
                <tr className="text-left text-ink-soft border-b border-line bg-surface-muted">
                  <th className="py-1.5 px-3">Followers</th>
                  <th className="py-1.5 px-3">Reach score</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["< 5,000", "1"],
                  ["5,000 – 19,999", "2"],
                  ["20,000 – 99,999", "3"],
                  ["100,000 – 499,999", "4"],
                  ["500,000+", "5"],
                ].map(([range, score]) => (
                  <tr key={range} className="border-b border-line last:border-b-0">
                    <td className="py-1.5 px-3 text-ink">{range}</td>
                    <td className="py-1.5 px-3 text-ink tabular-nums">{score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Callout>
            <p>
              <strong>@wanderlens_ari has 42,300 followers.</strong> That falls in the
              20,000–99,999 band →{" "}
              <strong className="text-ink">Reach = 3</strong>.
            </p>
          </Callout>
        </div>
      </section>

      {/* Resonance */}
      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold text-ink">Resonance</h2>
        <div className="text-sm text-ink-soft leading-relaxed space-y-3">
          <p>
            The <strong>median</strong> engagement rate — (likes + comments) ÷ followers — across
            posts from the <strong>last 90 days</strong>. Median rather than mean, so one viral
            post pushed to non-followers via Explore doesn&apos;t inflate the whole score. If none
            of the account&apos;s recent posts fall inside that window, it falls back to whatever
            posts are available and gets flagged <strong>stale</strong> (a ⚠ in Accounts) — scored,
            but on a note that the number reflects old content, not current performance.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-line rounded-md">
              <thead>
                <tr className="text-left text-ink-soft border-b border-line bg-surface-muted">
                  <th className="py-1.5 px-3">Median engagement rate</th>
                  <th className="py-1.5 px-3">Resonance score</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["< 1%", "1"],
                  ["1% – 2.99%", "2"],
                  ["3% – 5.99%", "3"],
                  ["6% – 9.99%", "4"],
                  ["10%+", "5"],
                ].map(([range, score]) => (
                  <tr key={range} className="border-b border-line last:border-b-0">
                    <td className="py-1.5 px-3 text-ink">{range}</td>
                    <td className="py-1.5 px-3 text-ink tabular-nums">{score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Callout>
            <p className="text-ink font-medium mb-2">
              @wanderlens_ari&apos;s last 5 posts (all within 90 days), 42,300 followers:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-line rounded-md bg-surface">
                <thead>
                  <tr className="text-left border-b border-line">
                    <th className="py-1 px-2">Post</th>
                    <th className="py-1 px-2">Likes</th>
                    <th className="py-1 px-2">Comments</th>
                    <th className="py-1 px-2">Engagement rate</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["A", "1,850", "62", "4.52%"],
                    ["B", "2,240", "88", "5.50%"],
                    ["C", "980", "40", "2.41%"],
                    ["D", "3,100", "145", "7.67%"],
                    ["E", "1,600", "55", "3.91%"],
                  ].map(([post, likes, comments, rate]) => (
                    <tr key={post} className="border-b border-line last:border-b-0">
                      <td className="py-1 px-2 text-ink">{post}</td>
                      <td className="py-1 px-2 text-ink tabular-nums">{likes}</td>
                      <td className="py-1 px-2 text-ink tabular-nums">{comments}</td>
                      <td className="py-1 px-2 text-ink tabular-nums">{rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2">
              Sorted: 2.41%, 3.91%, <strong className="text-ink">4.52%</strong>, 5.50%, 7.67% — the
              middle value (median) of 5 is <strong className="text-ink">4.52%</strong>. That falls
              in the 3%–5.99% band → <strong className="text-ink">Resonance = 3</strong>.
            </p>
          </Callout>

          <p>
            If those same 5 posts had all been older than 90 days instead — say the creator went
            quiet for a few months — Resonance would still compute to 3 from that same data, but
            the Accounts table would show a ⚠ next to it, so you know to weigh it differently than
            a score based on current activity.
          </p>
        </div>
      </section>

      {/* Relevance */}
      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold text-ink">Relevance</h2>
        <div className="text-sm text-ink-soft leading-relaxed space-y-3">
          <p>
            The only R that isn&apos;t derived from a formula — it&apos;s a judgment call, 1
            (irrelevant) to 5 (ideal fit), made by reading a creator&apos;s bio against your{" "}
            <strong>Brand statement</strong> and <strong>ICP</strong> from Settings. You can make
            that call yourself, or click &quot;Auto-score with Claude&quot; to have it read the
            same two things a human would and return a score plus a one-sentence rationale.
          </p>

          <Callout>
            <p className="text-ink font-medium mb-1">Voyable&apos;s brand statement + ICP:</p>
            <p className="mb-2">
              &quot;Voyable helps busy professionals book a curated, off-the-beaten-path trip in
              under 10 minutes — no back-and-forth with an agent.&quot; ICP: travel creators, any
              niche, with an engaged 25–40 audience; bonus for content about spontaneous or
              app-based trip planning.
            </p>
            <p className="text-ink font-medium mb-1">@wanderlens_ari&apos;s bio:</p>
            <p className="mb-2">
              &quot;Slow travel, fast bookings ✈️ · Remote-work + weekend hops · Currently:
              Lisbon&quot;
            </p>
            <p>
              Claude&apos;s judgment: <strong className="text-ink">Relevance = 5</strong> —
              &quot;Directly discusses fast, spontaneous travel booking and a remote-work
              lifestyle — near-exact audience and content match for Voyable&apos;s ICP.&quot;
            </p>
          </Callout>

          <p>
            For contrast, a fictional AI-tools reviewer with a similar follower count and
            engagement rate would score Reach = 3 and Resonance = 3 almost identically — but
            Relevance might come back as{" "}
            <strong className="text-ink">1</strong>, rationale: &quot;Content is entirely AI
            product reviews; no travel or trip-booking overlap with Voyable&apos;s ICP.&quot; Same
            Reach, same Resonance, completely different composite — which is the point of scoring
            Relevance separately rather than folding it into the other two.
          </p>
        </div>
      </section>

      {/* Composite */}
      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold text-ink">Composite score</h2>
        <div className="text-sm text-ink-soft leading-relaxed space-y-3">
          <p>
            A weighted average of Reach, Resonance, and Relevance, rounded to 2 decimals. It
            requires all three to be present — an account with no Relevance score yet shows no
            composite at all, rather than a misleading partial one. Default weights are 1/1/1 (a
            plain average); change them in Settings and every existing composite recomputes
            immediately, no re-scrape needed.
          </p>

          <Callout>
            <p className="text-ink font-medium mb-1">@wanderlens_ari, default weights (1/1/1):</p>
            <p className="mb-2 font-mono text-xs bg-surface rounded px-2 py-1 inline-block">
              (3×1 + 3×1 + 5×1) / (1+1+1) = 11 / 3 = 3.67
            </p>
            <p className="text-ink font-medium mb-1">
              Same account, weighted toward Reach (2/1/1) — e.g. an awareness-first campaign:
            </p>
            <p className="font-mono text-xs bg-surface rounded px-2 py-1 inline-block">
              (3×2 + 3×1 + 5×1) / (2+1+1) = 14 / 4 = 3.50
            </p>
          </Callout>

          <p>
            Same creator, same underlying data — a different composite because the campaign cares
            more about reach than fit. Neither number is &quot;more correct&quot;; the weights are
            there so the ranking reflects what actually matters for the campaign you&apos;re
            running.
          </p>
        </div>
      </section>

      <PrevNext
        prev={{ href: `${base}/pipeline`, label: "Pipeline" }}
        next={{ href: `${base}/accounts`, label: "Accounts" }}
      />
    </div>
  );
}
