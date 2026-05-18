# Away at Byron Bay — PMS (frontend)

The full FRS-faithful Next.js monorepo: UI **and** server actions, Drizzle,
Auth.js, pg-boss, Postgres RLS. One deployable app. Production deploy infra
(Dockerfile, compose, Dokploy, backups) lives in the **`backend`** repo —
see `docs/ARCHITECTURE-DECISIONS.md` ADR-001.

> **Read `CLAUDE.md` first.** It is the operating contract for this repo.

## Quick start

```bash
bun install
cp .env.example .env.local
bun -e "console.log(crypto.randomUUID()+crypto.randomUUID())"                                    # → AUTH_SECRET
bun -e "console.log(Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64'))"  # → ID_ENCRYPTION_KEY
bun db:up && sleep 5
bun drizzle:migrate && bun db:seed
bun dev                                  # http://localhost:3000
```

Seeded sign-in (password `Away123!`): `jenny@awayatbyron.com` (admin),
`manager1@awayatbyron.com` (Away at Byron Bay manager).

## Scripts

| | |
|---|---|
| `bun dev` / `build` / `start` | Next.js |
| `bun typecheck` / `lint` / `test` | quality gates (run before pushing) |
| `bun drizzle:generate` / `migrate` / `studio` | Drizzle Kit |
| `bun db:up` / `db:down` / `db:seed` / `db:reset` | local Postgres + MinIO |

## Layout

```
src/app/        (auth)/signin · (staff)/{home,calendar,bookings,…} · api/{auth,health}
src/modules/    one folder per FRS module — copy _template, see src/modules/README.md
src/db/         schema/ (Layer 0 done) · migrations/ · seed/
src/lib/        auth · rls · permissions · env · result · audit
src/components/ ui/ (Editorial Sunrise primitives) · shell/ (sidebar + topbar)
src/styles/     globals.css (design tokens, ported verbatim)
docs/           frs-v0.2 · schema · development-plan · bootstrap · vps-services
                ARCHITECTURE-DECISIONS · design-reference/
```

## What's built (Stage 0)

Auth.js v5 credentials sign-in · multi-tenant `withTenant`/`withPermission`
wrappers · `writeAudit` · tagged-union `result` · Layer 0 schema + seed ·
login screen · app shell (sidebar, property switcher, topbar) · dashboard ·
navigable placeholders for every module · canonical `_template` module · CI
(typecheck, lint, migrate, test, build) · health endpoints.

Stages 1–8 and the parallel-work split: `docs/development-plan.md`.
