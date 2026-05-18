# VPS services

Production runtime on the client Hetzner CPX31. Deploy infra and the full
stack live in the **`backend`** repo (ADR-001); this doc is the inventory +
principles.

> Paste the full baselined vps-services.md to replace this reference.

## Principle
Default self-hosted. Three managed exceptions: email upstream relay
(Resend/SES while Postal IP warms), SMS (Twilio, Phase 2), OTA sync
(Channex, Phase 2).

## Inventory (self-hosted unless noted)
Dokploy+Traefik · PostgreSQL 16 · MinIO · Postal · GlitchTip ·
Loki+Promtail+Prometheus+Grafana · restic→Hetzner Object Storage ·
Uptime Kuma · Forgejo (optional). Managed: Resend/SES, Twilio, Channex.

## Install order
Server hardening (deploy user, SSH keys only, ufw, fail2ban, Docker, UTC) →
Dokploy → Postgres (app+postal+glitchtip DBs) → MinIO (aab-prod, aab-backups)
→ Postal (relay mode first) → GlitchTip → observability → Uptime Kuma →
restic backups (6-hourly dump + ship, weekly check, monthly restore drill).

## App deploy (Dokploy)
Build `bun install --frozen-lockfile && bun run build`, start `bun run start`,
port 3000, `output:"standalone"`. Auto-deploy `main`→dev; promote dev→qa→prod
in Dokploy UI. Health: `/api/health`, `/api/health/db`. See `backend` repo.
