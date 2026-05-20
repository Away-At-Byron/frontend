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
RUN groupadd --system --gid 1001 aab \
 && useradd --system --uid 1001 --gid aab --shell /usr/sbin/nologin --create-home --home-dir /home/aab aab \
 && mkdir -p /home/aab/.cache && chown -R aab:aab /home/aab
COPY --from=build --chown=aab:aab /app/.next/standalone ./
COPY --from=build --chown=aab:aab /app/.next/static ./.next/static
# db-migrate ships the full source + build-stage node_modules + tsconfig so
# Dokploy compose jobs can run drizzle-kit migrate AND one-shot scripts like
# the seed (which imports src/lib/modules etc.). The standalone runtime keeps
# its own traced node_modules at /app/node_modules; db-migrate is a separate
# directory so the two never collide.
COPY --from=build --chown=aab:aab /app/src ./db-migrate/src
COPY --from=build --chown=aab:aab /app/drizzle.config.ts ./db-migrate/drizzle.config.ts
COPY --from=build --chown=aab:aab /app/tsconfig.json ./db-migrate/tsconfig.json
COPY --from=build --chown=aab:aab /app/node_modules ./db-migrate/node_modules
COPY --from=build --chown=aab:aab /app/package.json ./db-migrate/package.json
USER aab
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=4s --start-period=20s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["bun", "server.js"]
