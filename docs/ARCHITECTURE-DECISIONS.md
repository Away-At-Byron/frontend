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

---

## ADR-004 — Email-OTP 2FA on sign-in; remember-me replaces the 12h sliding session

**Date:** 2026-05-21 · **Status:** Accepted

**Context.** FRS §6.1 AC2 specified a single-factor sign-in (email +
password) with a 12-hour sliding JWT session. Jenny asked for a second
factor and a "stay signed in" option so day-to-day staff don't re-auth
mid-shift. Postal is the locked email service (CLAUDE.md tech stack); SMS
is logged-only in v1, so the channel is email. TOTP/authenticator apps
would push enrolment UX onto non-technical staff (Mary, Renato), which
contradicts the "obvious to accommodation staff" product rule.

**Decision.** Sign-in becomes two steps:

1. **Step 1 — credentials.** User submits email + password + a "Keep me
   signed in for 30 days" checkbox. The `requestOtp` server action
   (`src/app/(auth)/signin/actions.ts`) re-validates with a timing-safe
   bcrypt compare (still running the compare for unknown users, FRS §6.1
   AC4 anti-enumeration). On success it writes a 6-digit code to the user
   row and emails it via `sendEmail` (`src/lib/email.ts`).
2. **Step 2 — code.** User enters the code; the form calls
   `signIn("credentials", { email, password, otp, rememberMe })`. The
   NextAuth `authorize` callback re-checks the password and verifies the
   OTP atomically: code matches, not expired, attempts under cap. On
   success it burns the code (sets `otp`, `otp_expires_at`, `otp_attempts`
   to null/0) and stamps `last_login_at`.

**Storage.** Three new columns on `users` (migration `0004_users_otp`):
`otp text`, `otp_expires_at timestamptz`, `otp_attempts int not null
default 0`. **The OTP is stored in plain text by product decision** — the
10-minute TTL and the attempts cap bound the blast radius, and adding a
hash buys little against an attacker who already has `SELECT` on `users`.
This is the one deliberate divergence from defence-in-depth.

**Limits.**
- OTP TTL: **10 minutes** from issue.
- Attempts: **5** wrong codes invalidate the current OTP (the row stays;
  the next `requestOtp` call resets the counter and issues a new code).
- Codes are single-use — cleared on the first successful verify.

**Session length (supersedes §6.1 AC2's 12-hour sliding rule):**
- Remember-me **on** → 30-day sliding JWT.
- Remember-me **off** → 1-day sliding JWT.
- Cookie `maxAge` is set to 30 days so the longer-lived sessions persist;
  per-request expiry is enforced by `token.exp` in the `jwt` callback.

**Consequences.**
- v1 dev runs `EMAIL_TRANSPORT=console`, so OTPs print to stdout. Production
  uses Postal once the comms module lands; `sendEmail` throws for the SMTP
  branch until then.
- The OTP plain-text choice is a deliberate, recorded risk acceptance —
  revisit if/when the user base grows past the three-property internal team.
- No new tables and no new auth tokens; the pending-2FA state lives in the
  user row, and the browser carries email+password between steps. No
  separate "trust this device" cookie in v1.
- TOTP and per-device trust are deferred. Re-open this ADR if Jenny wants
  to drop email round-trips for power users.

---

## ADR-005 — Contact portal: OTP-only sign-in at `/portal/*`, single Auth.js with `subjectType`

**Date:** 2026-05-21 · **Status:** Accepted

**Context.** Jenny asked for a second sign-in surface so contacts
(housekeepers, contractors, and selectively guests) can log in to their own
view. The FRS only specs staff sign-in (§6.1). Two identity types raise a
real architecture question: one Auth.js with a discriminated session, or
two parallel NextAuth instances with separate cookies. Sessions are JWT
(ADR-004), so the `sessions` table is currently unused — splitting it isn't
required by the storage layer.

**Decision.** One Auth.js setup, two Credentials providers, one JWT.

- **Staff provider** (`id: "credentials"`) — unchanged from ADR-004.
- **Contact provider** (`id: "contact-otp"`) — `email + otp` only, no
  password. `authorize()` looks up the contact by `lower(email)`, requires
  `portal_enabled = true`, then runs the same OTP check (fresh + matches +
  under the 5-attempt cap, burn on success).
- The JWT carries a `subjectType: "user" | "contact"` claim. The
  `(staff)` layout redirects `subjectType === "contact"` to
  `/portal/dashboard`; the `(portal)` layout redirects `subjectType ===
  "user"` to `/home`. The portal sign-in page is public; the dashboard
  enforces a contact session itself.
- Session length: contacts get the **1-day** short window only. No
  remember-me — re-auth daily is reasonable for the contact use case and
  keeps the surface small.

**Schema delta on `contacts`** (migration `0005_contacts_portal`):
- `portal_enabled boolean not null default false` — admins opt in per
  contact. Default OFF so the guest address book is never silently a list
  of logins.
- `otp text`, `otp_expires_at timestamptz`, `otp_attempts int not null
  default 0`, `last_login_at timestamptz` — same shape and rules as
  ADR-004's users 2FA.
- `unique index contacts_email_lower_unique on lower(email) where email
  is not null` — login lookup needs email→contact to be 1:1. Partial
  index because `contacts.email` is nullable (most guest rows).

**Anti-enumeration.** `requestContactOtp` returns the same `{ ok: true }`
shape whether or not the email matches a portal-enabled contact. The OTP
write + email send happen only on a real match. The contact list is
internal data, so the goal is to avoid making it queryable through the
sign-in form.

**Routes.**
- `/portal/signin` — two-step UI (email → 6-digit code). Public.
- `/portal/dashboard` — placeholder, contact session required.
- The existing `/signin` stays staff-only.

**Consequences.**
- The unused `sessions` table is left in place; if a future change moves
  Auth.js to a DB-session strategy, one row shape covers both identity
  types via the `subjectType` column added there.
- An email that exists as both a staff `users.email` and a
  `contacts.email` works at both surfaces independently. The two sign-in
  routes never share state, so the same person can be both — but rules of
  thumb (admin shouldn't be a contact of their own property) belong in
  product policy, not the schema.
- Module-access plumbing (`access.ts`, ADR-003) is staff-only and never
  touches the contact session. Future portal features add their own
  permission layer.
- Rate limiting on `requestContactOtp` is **not in v1**. Worth adding
  before the portal sees external traffic; track when the first real
  contact feature lands.
