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

---

## ADR-003 — Module access: static role defaults + per-user overrides

**Date:** 2026-05-19 · **Status:** Accepted

**Context.** The client wants six roles (`admin, manager, staff,
housekeeper, contractor, other`) and module reachability controlled in two
ways: a **static default per role** (set in code by the client), and a
**per-user override** an admin edits inside the existing Users CRUD —
replicating the per-user access engine from their previous product
(`documentation/02-user-crud.md`). The seeded roles were
`admin/manager/front_desk/housekeeper/accounts`; `src/lib/permissions.ts`
is a static action-RBAC map and FRS §6.3 AC5 says the server-action
boundary is authoritative while "any UI hiding is UX sugar only." An
earlier iteration (admin-editable *groups* via `roles.permission_set`) was
removed in favour of this model.

**Decision.** Two layers, neither touching auth/login or the `users` table:

- **Tier 1 (security), unchanged:** the static `permissions.ts` map still
  gates every server action — the source of truth (FRS §6.3 AC5 honoured).
- **Tier 2 (reachability):** which modules/nav a user can open.
  - `ROLE_DEFAULTS` in `src/lib/modules.ts` is the **static, code-owned**
    default per role. Not runtime-editable.
  - An admin may switch OFF some of a user's role-default modules. The
    override is stored in a **new** table `user_module_access`
    (`user_id, module_code`); the `users` table is untouched. No rows for
    a user = no override = full role default.
  - Effective access = role default ∩ per-user override; `admin` is always
    full; `dashboard` is always on (redirect target); `users` is admin-only
    and never a toggle. A user can never gain a module outside its role
    default — so the Users modal only shows that role's default modules.
- Roles reconciled to the six via data migration `0001_roles_groups`
  (+ idempotent seed): keep `admin/manager/housekeeper`, add
  `staff/contractor/other`, remap `front_desk→staff`/`accounts→manager`,
  drop the retired two. New table created by migration `0002`.
- Enforcement: the `(staff)` layout reads the user's effective modules to
  render nav dynamically; each page calls `assertModuleAccess`/`assertAdmin`
  (`src/lib/access.ts`) and redirects disallowed visits to `/home`. The
  JWT/session is unchanged.

**Consequences.** `roles.permission_set` is **not** used for access (left
empty). Per-user access lives in `user_module_access`, cascading on user
delete. Distinguishing "no override" from "explicitly nothing" uses a
`__none__` sentinel row. **Open items:** (1) `manager` cannot disable users
— `user.delete` absent from the static map (Dev A owns it); (2) `Messages`
has no catalogue module yet, so its nav entry is admin-only; (3) "Timesheet"
isn't a module/route, so the Housekeeper default uses `housekeeping` only.
