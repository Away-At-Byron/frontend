# Bootstrap

Stage 0 is **already done** in this repo. New devs: onboarding only.

## Onboarding (2nd/3rd dev)
```bash
git clone git@github.com:Away-At-Byron/frontend.git
cd frontend
bun install
cp .env.example .env.local
bun -e "console.log(crypto.randomUUID()+crypto.randomUUID())"  # → AUTH_SECRET
bun -e "console.log(Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64'))"  # → ID_ENCRYPTION_KEY
bun db:up && sleep 5
bun drizzle:migrate && bun db:seed
bun dev      # http://localhost:3000  → /signin
```
Seeded login: `jenny@awayatbyron.com` / `Away123!` (admin),
`manager1@awayatbyron.com` / `Away123!` (property manager).

## What Stage 0 delivered
Next.js 16 + Bun + TS strict · Editorial Sunrise design system ·
Layer 0 schema + seed · Auth.js v5 (credentials) · `withTenant` /
`withPermission` / `writeAudit` / `result` lib · login + app shell +
dashboard + navigable module placeholders · `_template` module · CI ·
`docker-compose.dev.yml` (Postgres+MinIO). Production deploy infra: the
`backend` repo.

## Quality gates (run before pushing)
`bun typecheck` · `bun lint` · `bun test` · `bun build`.

## Verification checklist
- [ ] `bun dev` serves :3000, `/` → `/home` → `/signin` when signed out
- [ ] sign in with a seeded user → dashboard renders
- [ ] `docker compose -f docker-compose.dev.yml ps` healthy
- [ ] `bun drizzle:migrate` clean · `bun typecheck` · `bun lint` · `bun build`
- [ ] `/api/health` 200 · `/api/health/db` 200 with db up
