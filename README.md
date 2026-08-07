# 3R Influencer Scoring

A local tool for scoring Instagram creators on **Reach**, **Resonance**, and **Relevance**
when shortlisting influencers for a marketing campaign. Runs entirely on your own machine —
no account, no login, no cloud database. Clone it, run it, paste in your own API keys.

- **Reach** — follower count, bucketed into a 1–5 score.
- **Resonance** — median engagement rate across a creator's posts from the last 90
  days (falls back to older posts, flagged as stale, if none qualify).
- **Relevance** — fit against your brand statement and ideal customer profile, scored
  manually or in bulk with Claude.

Supports multiple projects (separate campaigns/clients), each with its own creator list,
brand statement, and 3R settings. Apify (for scraping) and Anthropic (for automated
Relevance scoring) API keys are bring-your-own, set once in Settings and shared across
every project.

## Getting started

```bash
git clone https://github.com/abhagat-viven/3r-influencer-scoring.git
cd 3r-influencer-scoring
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). That's it — a local SQLite database
(`data/influencer.db`, gitignored) is created automatically on first run, with a starter
project already there.

From there:

1. **Settings → API Keys**: paste your Apify token and/or Anthropic key. Without them,
   scraping and automated Relevance scoring are unavailable, but manual Relevance scoring
   still works.
2. **Import**: upload an Instagram "following" export (JSON), a CSV of handles, or a rate
   card.
3. **Pipeline**: scrape and score everyone you imported.
4. **Accounts**: review, rank, and export a shortlist.

The in-app **Guide** tab (next to Settings, once you're in a project) walks through all
of this in more depth.

### Getting your Instagram following export

Instagram → Settings → Accounts Center → Your information and permissions → Export your
information → select "Following" only, JSON format.

## Requirements

- Node.js 22.5+ (for the built-in `node:sqlite` module — no separate database install).

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19 + TypeScript + Tailwind v4
- SQLite via Node's built-in `node:sqlite` — a single file on disk, no server to run
- [Apify](https://apify.com) for Instagram scraping, [Anthropic's Claude](https://www.anthropic.com) for optional automated Relevance scoring

## Security notes

- No login, no user accounts — this is meant to run on your own machine for you alone.
  Don't expose it to the public internet as-is.
- API keys are stored in the local SQLite file, in plaintext. That file never leaves your
  machine unless you copy it somewhere — there's no server-side risk to weigh, unlike a
  hosted multi-user version would have.
- Uploaded files (following exports, CSVs, rate cards) are parsed in memory on upload and
  never written to disk — only the parsed rows are persisted, in `data/influencer.db`.

## License

MIT — see [LICENSE](LICENSE). Fork it, rename it, make it yours.
