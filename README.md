<p align="center">
  <img src="public/brand/choguild-mark.png" alt="Choguild" width="160" />
</p>

<h1 align="center">Choguild</h1>

<p align="center">
  <strong>Show the work and wear the name.</strong><br />
  A contributor guild for the Monad ecosystem: a passport for your name, a board of open work, and a record of reviewed contributions.
</p>

---

## What it does

| Area | What you can do |
| --- | --- |
| **Passport** | Connect a browser wallet, sign a message (Sign-In with Ethereum, never a transaction), and save a public profile with your skills and links. |
| **Discover** | Browse the opportunity board. Search and filter by skill, category, compensation, and status. |
| **Opportunities** | Publish open work, edit your listings, and review the applications they receive. |
| **Applications** | Track what you applied to and where each application stands. |
| **Submissions** | Once accepted, submit evidence of the work. Reviewed submissions build your contribution history. |
| **Ranking** | The Chog ladder: every public passport ranked by XP earned from reviewed work, with a top-3 podium. |
| **How it works** | The full loop, the XP table, the five ranks, and an FAQ. |
| **Network** | Live Monad mainnet status for the RPC the app uses. |

A connected wallet is only an address. Nothing is treated as an account until you sign and save a passport, and Choguild never asks for a seed phrase or private key.

## XP and ranks

XP is calculated live from the database, so it can't drift out of sync with the board.

| Action | XP |
| --- | --- |
| Accepted submission | +100 |
| Accepted application | +25 |
| Published opportunity (not draft, not demo) | +15 |
| Saved public passport | +10 |

Ranks: **Hatchling** (0) → **Apprentice** (50) → **Artisan** (150) → **Guildmaster** (400) → **Legend** (1000). The rules live in `src/lib/ranking/xp.ts`.

## Getting around

- **Sidebar** on desktop, **bottom tab bar** on phones.
- **⌘K / Ctrl+K** opens a jump menu for every page and common action (publish, new submission, your listings).
- Detail and form pages show a **Back** control in the header.

## Tech stack

- [TanStack Start](https://tanstack.com/start) (React 19, file-based routing, server functions)
- Tailwind CSS v4, Radix UI primitives, `cmdk`, `lucide-react`
- `wagmi` + `viem` for wallets and Monad; SIWE for passport sessions
- Postgres via `pg` when `DATABASE_URL` is set, otherwise an in-memory [PGLite](https://pglite.dev) database
- Deployed on Vercel through Nitro

## Run it locally

Requires Node 22.

```bash
npm install
npm run dev        # http://localhost:8080
```

No database is needed for local work: PGLite starts in memory and applies `migrations/` on boot.

### Checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Configuration

Copy `.env.example` into your host's environment settings. Do not commit real values.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | For persistent data | Postgres connection string (Neon works well). Without it, data lives in memory and resets when the server restarts. |
| `CHOG_SESSION_SECRET` | Yes, when `DATABASE_URL` is set | At least 32 random characters. Signs passport sessions. |
| `VITE_MONAD_RPC_URL` | No | Override the public Monad RPC. |

## Deploy to Vercel

1. Import the repository in Vercel. The framework preset can stay on **Other**; `vercel.json` and the Nitro build output handle the rest.
2. Add `CHOG_SESSION_SECRET` (and `DATABASE_URL` if you want data to persist).
3. Deploy. `npm run build` runs the database migrations automatically when `DATABASE_URL` is present.

## Project layout

```
src/
  routes/          pages (file-based routing)
  components/      UI: layout shell, board, passport, work
  lib/board/       opportunities and applications
  lib/work/        submissions and reviews
  lib/passport/    profiles, SIWE sessions, wallet config
  lib/monad/       network status
  lib/ranking/     XP rules, tiers, and the ranking query
migrations/        SQL schema, applied in order
public/brand/      Chog mascot artwork
```

## License

No license has been chosen yet. All rights reserved by the repository owner until one is added.
