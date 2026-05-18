> **Read `docs/ARCHITECTURE-DECISIONS.md` alongside this file.** Two ADRs
> pin down how this repo relates to the `backend` repo (ADR-001) and the
> approved "Editorial Sunrise" design tokens (ADR-002). Everything below is
> the baselined spec and remains authoritative.

# Away at Byron Bay PMS

This file is read first by Claude Code on every session. It tells you what this project is, what the rules are, and where to find the details.

---

## What this is

A multi-property guesthouse management system for Jenny Junker at Away at Byron Bay. v1 replaces Jenny's three RMS Cloud licenses (Away at Byron Bay, Away on Shirley Lane, Unwind Guesthouse) with one self-hosted install on the client VPS. Multi-tenant from day one via Postgres RLS, single Bun container, no separate backend service.

**Status:** Tech stack locked. Data schema approved. FRS v0.2 baselined. Three developers building in parallel through a dependency-ordered build sequence (see `docs/development-plan.md`). Stage 0 bootstrap complete.

**Audience for this code:** non-technical accommodation staff (Mary, Renato, Jenny). Mobile housekeeper PWA is required. No "we'll explain it in onboarding" UX. The product has to be obvious.

---

## Tech stack (LOCKED, do not deviate)

| Layer | Choice |
|---|---|
| Runtime | Bun (latest stable) |
| App | Next.js 16 App Router, single repo, route handlers + server actions |
| Language | TypeScript strict, no `any`, no `// @ts-ignore` |
| Database | PostgreSQL 16 (self-hosted on VPS) |
| ORM | Drizzle, schema-first, source of truth for the data model |
| Migrations | Drizzle Kit |
| Background jobs | pg-boss on the same Postgres instance, no Redis |
| Auth | Auth.js v5 with Drizzle adapter |
| Validation | Zod, shared between client and server |
| UI | shadcn/ui + Tailwind + Radix, themed to client palette |
| Tables | TanStack Table |
| Forms | React Hook Form + Zod resolvers |
| Charts | Recharts |
| File storage | MinIO (self-hosted, S3-compatible) |
| Email | Postal (self-hosted); managed relay fallback while IP warms |
| SMS | Twilio (Phase 2 only; v1 logs SMS but does not send) |
| Error tracking | GlitchTip (self-hosted, Sentry-compatible) |
| Logs + Metrics | Loki + Prometheus + Grafana (self-hosted) |
| Reverse proxy | Traefik (comes with Dokploy) |
| Deployment | Dokploy on Hetzner CPX31, one Bun container |

Anything not on this list requires written agreement from the tech lead before adding.

---

## Critical rules

1. **The FRS is the spec.** `docs/frs-v0.2.md`. If the code disagrees with the FRS, fix the FRS first, then change the code. If you think the FRS is wrong, open a discussion (record it in `docs/ARCHITECTURE-DECISIONS.md`), do not silently change behaviour.
2. **The Drizzle schema is the source of truth for the data model.** Change a column → update schema, write a migration, regenerate types, then update calling code. In that order.
3. **Multi-tenant via RLS.** Every tenanted table has `property_id NOT NULL`. Every Postgres session sets `app.property_id` before any query. Never query without setting the GUC first — use `withTenant`.
4. **Money is `integer cents`.** Never `float`, never `decimal`.
5. **Server actions for staff-facing mutations. Route handlers for machine-to-machine (webhooks, integrations, cron).**
6. **Validate every server action input with Zod.** Import the same Zod schema in the React form.
7. **Return shape from every server action: `{ ok: true, data }` or `{ ok: false, error: { code, message, fields? } }`.** No throwing across the network boundary. Use `src/lib/result.ts`.
8. **Tests ship in the same PR as the code.** Bun's built-in test runner. Acceptance criteria from the FRS are the test cases.
9. **PRs reviewed within 4 working hours.**
10. **Conventional Commits for every commit.** `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`.
11. **Never commit secrets, .env files, or generated artifacts.**
12. **No em-dashes in user-facing copy.** Use a hyphen, a comma, or split the sentence.

---

## Project structure

```
.
├── CLAUDE.md                   # this file
├── docs/                       # frs-v0.2, schema, bootstrap, development-plan,
│                               #   vps-services, ARCHITECTURE-DECISIONS, design-reference/
├── src/
│   ├── app/                    # Next.js App Router — (auth), (staff), api/
│   ├── modules/                # one folder per FRS module (see src/modules/README.md)
│   ├── db/                     # schema/ migrations/ seed/ index.ts
│   ├── lib/                    # auth, permissions, rls, env, result, audit, jobs
│   ├── components/             # ui/ (primitives, themed) + shell/
│   └── styles/                 # globals.css (Editorial Sunrise tokens)
├── drizzle.config.ts
├── docker-compose.dev.yml      # LOCAL dev only (Postgres + MinIO)
└── package.json
```

Production deploy infra (Dockerfile, full compose, Dokploy, backups) lives
in the **`backend`** repo — see ADR-001.

### Module structure

Every FRS module gets one folder under `src/modules/`. Copy `src/modules/_template`.
See `src/modules/README.md` for the convention, ownership matrix, and
migration-numbering rule that keeps three devs conflict-free.

---

## Where to find detail

| If you're doing… | Read |
|---|---|
| Repo init, db init, hello world | `docs/bootstrap.md` |
| Implementing a feature against the spec | `docs/frs-v0.2.md` |
| Adding a table or column | `docs/schema.md` |
| "What should I work on this week" | `docs/development-plan.md` |
| VPS, services, deployment | `docs/vps-services.md` + the `backend` repo |
| Why something diverges from the FRS | `docs/ARCHITECTURE-DECISIONS.md` |

---

## Brand voice and design tokens

**Voice:** no em-dashes; no "leverage / robust / seamless / synergy /
streamline / unlock"; plain English, present tense, second person; specific
over abstract; short sentences mixed with long. No machine cadence.

**Design tokens:** "Editorial Sunrise", ported verbatim into
`src/styles/globals.css` from the approved design bundle. Fraunces (display),
Inter (UI), JetBrains Mono (mono) via `next/font`. Originals in
`docs/design-reference/`. See ADR-002.

---

## Definition of Done (per module)

1. All FRS acceptance criteria have passing tests.
2. Drizzle schema covers every FRS column.
3. RLS policy + a cross-tenant isolation test on every tenanted table.
4. All server actions return the `{ ok, data | error }` union.
5. Forms use RHF + Zod resolver with the schema imported from the module.
6. Page themed to brand tokens, correct on mobile and desktop.
7. Audit log fires on every state-changing action.
8. Module README links the FRS section and lists open questions.
9. PR reviewed and merged within 4 hours of being marked ready.
10. Jenny has seen a 5-minute walkthrough of any user-visible change.

---

## When in doubt

The spec wins (`docs/frs-v0.2.md`). The schema is the source of truth for
data (`docs/schema.md`). When the FRS itself is unclear, open a discussion
and record it in `docs/ARCHITECTURE-DECISIONS.md`. Do not invent.
