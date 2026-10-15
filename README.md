<p align="center">
  <img src="public/favicon.svg" alt="Choguild" width="64" />
</p>

<h1 align="center">Choguild</h1>

<p align="center">
  <strong>Get work and earn your rank.</strong><br />
  A contributor guild for the Monad ecosystem: a passport for your name, a board of open work, and a record of reviewed contributions.
</p>

<p align="center">
  <a href="https://choguild.vercel.app"><img alt="Live" src="https://img.shields.io/badge/live-choguild.vercel.app-0a0a0b?style=flat-square&logo=vercel" /></a>
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-0a0a0b?style=flat-square" /></a>
  <img alt="Node 22+" src="https://img.shields.io/badge/node-%E2%89%A522-0a0a0b?style=flat-square&logo=node.js" />
</p>

<p align="center">
  <img src="docs/images/home.png" alt="Choguild home page" width="820" />
</p>

<p align="center">
  <img src="docs/images/discover.png" alt="Opportunity board" width="560" />
  &nbsp;
  <img src="docs/images/ranking-mobile.png" alt="Ranking on mobile" width="200" />
</p>

Everything on the site is real: listings, passports, and XP come straight from the database and Monad mainnet. There is no seeded or demo content; an empty board means nobody has published yet.

---

## What it does

| Area | What you can do |
| --- | --- |
| **Passport** | Connect a browser wallet, sign a message (Sign-In with Ethereum, never a transaction), and save a public profile with your skills and links. |
| **Discover** | Browse the opportunity board. Search and filter by skill, category, compensation, and status. |
| **Opportunities** | Publish open work, edit your listings, and review the applications they receive. |
| **Applications** | Track what you applied to and where each application stands. |
| **Submissions** | Once accepted, submit evidence of the work. Reviewed submissions build your contribution history. |
| **Ranking** | The Chog ladder: every public passport ranked by guild XP and onchain Monad activity, with Overall / Guild work / Onchain views and a top-3 podium. |
| **How it works** | The full loop, the XP table, the five ranks, and an FAQ. |
| **Network** | Live Monad mainnet status for the RPC the app uses. |

A connected wallet is only an address. Nothing is treated as an account until you sign and save a passport, and Choguild never asks for a seed phrase or private key.

## XP and ranks

XP is calculated live from the database, so it can't drift out of sync with the board.

| Action | XP |
| --- | --- |
| Accepted submission | +100 |
| Accepted application | +25 |
| Published opportunity (not draft) | +15 |
| Saved public passport | +10 |
| Onchain activity on Monad mainnet | 10 × √(transactions sent), up to +150 |

Onchain XP reads each passport wallet's transaction count from the public Monad RPC (batched, cached for 10 minutes). The square root and the cap mean steady activity counts, but spamming transactions can't outrank reviewed guild work, and balances are never used. The Ranking page can sort by **Overall**, **Guild work**, or **Onchain**.

Ranks: **Hatchling** (0) → **Apprentice** (50) → **Artisan** (150) → **Guildmaster** (400) → **Legend** (1000). The rules live in `src/lib/ranking/xp.ts`.

## Getting around

- A **floating dock** at the bottom of every screen holds the main pages (Home, Discover, Ranking, Passport). Its **More** and **Account** buttons morph it open into panels for the remaining pages, quick actions, what's new, and your passport status.
- **⌘K / Ctrl+K** opens a jump menu for every page and common action.
- The header has search, a **light/dark toggle**, and Wallet. Detail pages show a **Back** control.

## Tech stack

- [TanStack Start](https://tanstack.com/start) (React 19, file-based routing, server functions)
- Tailwind CSS v4, Radix UI primitives, Motion, `cmdk`, `lucide-react`; Geist and Geist Mono
- Upstream Monad RPC reads are cached in-process (stale-while-revalidate, with a failure backoff) so a slow RPC never blocks a page render
- `wagmi` + `viem` for wallets and Monad; SIWE for passport sessions
- Postgres via `pg` when `DATABASE_URL` is set, otherwise an in-memory [PGLite](https://pglite.dev) database
- Deployed on Vercel through Nitro

## Run it locally

Requires Node 22 (see `.nvmrc`).

```bash
npm install
npm run dev        # http://localhost:8080
```

No database is needed for local work: PGLite starts in memory and applies `migrations/` on boot.

### Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Configuration

Copy `.env.example` into your host's environment settings. Do not commit real values.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | For persistent data | Postgres connection string (Neon works well). Without it, data lives in memory and resets when the server restarts. |
| `CHOG_SESSION_SECRET` | Yes, on every deployed build | At least 32 random characters (`openssl rand -hex 32`). Signs passport sessions. |
| `VITE_MONAD_RPC_URL` | No | Override the public Monad RPC. |

## Deploy to Vercel

1. Import the repository in Vercel. The framework preset can stay on **Other**; `vercel.json` and the Nitro build output handle the rest.
2. Add `CHOG_SESSION_SECRET` and `DATABASE_URL`. Without `DATABASE_URL` the deployed app runs on in-memory PGLite and every cold start wipes the data.
3. Deploy. `npm run build` runs the database migrations automatically when `DATABASE_URL` is present.

## Project layout

```
src/
  routes/          pages (file-based routing)
  components/      UI: layout shell, board, passport, work
  lib/board/       opportunities and applications
  lib/work/        submissions and reviews
  lib/passport/    profiles, SIWE sessions, wallet config
  lib/monad/       network status and onchain activity (tx counts)
  lib/ranking/     XP rules, tiers, and the ranking query
migrations/        SQL schema, applied in order
public/brand/      Choguild mark (SVG)
scripts/           migrations runner, brand renderer (og.jpg, touch icon)
```

## License

[MIT](LICENSE)
