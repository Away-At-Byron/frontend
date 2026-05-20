# Production image for the Away PMS app.
#
# Built by the frontend repo's GitHub Actions workflow and pushed to GHCR:
#   ghcr.io/away-at-byron/frontend:sha-<short>
#   ghcr.io/away-at-byron/frontend:dev   (rolling, follows main)
#   ghcr.io/away-at-byron/frontend:prod  (rolling, follows tagged releases)
#   ghcr.io/away-at-byron/frontend:v1.2.3
#
# Local build (rare): `docker build -t aab-pms:local .` from the repo root.
# The backend repo has a separate Dockerfile that builds from a pinned ref via
# GH_TOKEN; that variant is for one-off out-of-CI builds. See backend/Dockerfile.

# ── Build ────────────────────────────────────────────────────
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1 SKIP_ENV_VALIDATION=1
RUN bun run build

# ── Runtime (slim, standalone) ───────────────────────────────
FROM oven/bun:1-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 aab \
 && adduser --system --uid 1001 aab
COPY --from=build --chown=aab:aab /app/.next/standalone ./
COPY --from=build --chown=aab:aab /app/.next/static ./.next/static
# Drizzle schema + migrations travel with the image so the migrate job in
# Dokploy's compose can apply them before the app starts.
COPY --from=build --chown=aab:aab /app/src/db ./db-migrate/src/db
COPY --from=build --chown=aab:aab /app/drizzle.config.ts ./db-migrate/
COPY --from=build --chown=aab:aab /app/node_modules/drizzle-kit ./db-migrate/node_modules/drizzle-kit
USER aab
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=4s --start-period=20s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["bun", "server.js"]
