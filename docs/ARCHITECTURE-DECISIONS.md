# Architecture decisions

Living record of decisions that diverge from, or pin down, the FRS.
Per CLAUDE.md rule 1, the FRS is the spec — when we deviate, it is recorded
here first, with reasoning, before code.

---

## ADR-001 — Two repos: monorepo in `frontend`, deployable infra in `backend`

**Date:** 2026-05-18 · **Status:** Accepted

**Context.** The client created two GitHub repos, `Away-At-Byron/frontend`
and `Away-At-Byron/backend`. The entire baselined spec (FRS v0.2, CLAUDE.md,
schema.md, development-plan.md, bootstrap.md) is written for a **single
Next.js monorepo** using server actions, single Bun container, RLS via
session GUC. A literal frontend/backend split would invalidate all of it.

**Decision.** `frontend` holds the **complete FRS-faithful Next.js
monorepo** (UI + server actions + Drizzle + Auth.js + pg-boss + RLS) exactly
as the spec describes — zero rework. `backend` holds **deployable infra
only**: production Dockerfile, docker-compose, migration runner,
Dokploy/Hetzner config, env templates. Both repos are used; the spec is
untouched.

**Consequences.** All FRS module/server-action/RLS decisions stand. Local
dev services (Postgres + MinIO) live in `frontend/docker-compose.dev.yml`
for one-minute setup; the production stack lives in `backend`. The app image
is `output: "standalone"` so `backend`'s Dockerfile ships a slim runtime.

---

## ADR-002 — Design tokens: "Editorial Sunrise" supersedes the FRS §3 placeholders

**Date:** 2026-05-18 · **Status:** Accepted

**Context.** FRS §3 / CLAUDE.md list locked brand hexes plus several "TBD
from Moqups" tokens. The client subsequently iterated a full, approved
design system ("Editorial Sunrise") in the Claude Design bundle, which
includes the complete token set and refined values (e.g. teal `#9DC9C4`
vs the FRS placeholder `#9FC9CA`, ink `#1F2A2A` vs `#3F3A3A`).

**Decision.** `src/styles/globals.css` ports the approved bundle's
`system/tokens.css` verbatim as the single source of truth. Fraunces +
Inter + JetBrains Mono via `next/font`. shadcn/ui is **not** used —
primitives are hand-built to the bundle so output is pixel-faithful; this
satisfies the CLAUDE.md intent (themed to client palette, not default
slate) better than theming shadcn would.

**Consequences.** FRS §3's TBD tokens are resolved by the bundle. Icons:
the bundle's custom hospitality set is mapped to `lucide-react` (the locked
icon lib) at matching stroke weight — visually equivalent, stack intact.
Reference originals are in `docs/design-reference/`.
