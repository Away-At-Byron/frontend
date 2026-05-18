<!-- Title: [<module>] <conventional-commit summary> -->

## What
<!-- One sentence. -->

## FRS / spec
- Module: `docs/frs-v0.2.md` §6.x
- Stage: `docs/development-plan.md` Stage x

## Definition of Done (CLAUDE.md)
- [ ] FRS acceptance criteria have passing tests
- [ ] Drizzle schema covers every FRS column; migration committed
- [ ] RLS policy + cross-tenant isolation test on new tenanted tables
- [ ] Server actions return the `{ ok, data | error }` union
- [ ] Forms use RHF + Zod resolver with the module's schema
- [ ] Themed to brand tokens; correct on mobile + desktop
- [ ] Audit log fires on every state-changing action
- [ ] `bun typecheck && bun lint && bun test && bun build` green
- [ ] No secrets, no `any`, no em-dashes in user copy
