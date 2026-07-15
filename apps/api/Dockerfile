# syntax=docker/dockerfile:1
# Cipansor API — multi-stage production image.
#
# The runner carries a fresh production-only dependency install (dev deps are
# never installed, so nothing to prune) plus the compiled JS and the generated
# Prisma client. The deps/prod-deps stages copy only the api + shared manifests
# (never web), so web deps are never installed either.
#
# Behind a TLS-terminating egress proxy, pass the proxy CA as a build secret:
#   docker build --secret id=proxyca,src=<ca.crt> -f apps/api/Dockerfile -t cipansor-api .
# In a normal network the secret is unused and the build works without it.

FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV CI=true
WORKDIR /app
RUN --mount=type=secret,id=proxyca,required=false \
    if [ -f /run/secrets/proxyca ]; then \
      cat /run/secrets/proxyca >> /etc/ssl/certs/ca-certificates.crt; \
    fi && \
    NODE_EXTRA_CA_CERTS=/run/secrets/proxyca corepack enable && \
    NODE_EXTRA_CA_CERTS=/run/secrets/proxyca corepack prepare pnpm@11.13.0 --activate

# Manifests only (api + shared; web is intentionally omitted).
FROM base AS manifests
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# ---- deps: full install (incl. dev) so we can build ----
FROM manifests AS deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    --mount=type=secret,id=proxyca,required=false \
    NODE_EXTRA_CA_CERTS=/run/secrets/proxyca pnpm install --frozen-lockfile

# ---- prod-deps: fresh production-only install for the runtime image ----
FROM manifests AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    --mount=type=secret,id=proxyca,required=false \
    NODE_EXTRA_CA_CERTS=/run/secrets/proxyca pnpm install --frozen-lockfile --prod

# ---- builder: compile shared + api, generate the Prisma client ----
FROM base AS builder
ENV NODE_OPTIONS=--max-old-space-size=4096
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .
RUN --mount=type=secret,id=proxyca,required=false \
    NODE_EXTRA_CA_CERTS=/run/secrets/proxyca pnpm --filter @cipansor/shared build \
 && NODE_EXTRA_CA_CERTS=/run/secrets/proxyca pnpm --filter api db:generate \
 && pnpm --filter api build
# Stage the generated Prisma client + its `.prisma` artifacts (both live inside
# the @prisma/client package dir in pnpm's virtual store).
RUN set -e; \
    STORE="$(find /app/node_modules/.pnpm -maxdepth 1 -type d -name '@prisma+client@*' | head -1)/node_modules"; \
    cp -RL "$STORE/@prisma/client" /tmp/prisma-client; \
    cp -RL "$STORE/.prisma" /tmp/dot-prisma

# ---- assemble: overlay the generated client into the prod-deps store ----
FROM prod-deps AS assemble
COPY --from=builder /tmp/prisma-client /tmp/prisma-client
COPY --from=builder /tmp/dot-prisma /tmp/dot-prisma
RUN set -e; \
    STORE="$(find /app/node_modules/.pnpm -maxdepth 1 -type d -name '@prisma+client@*' | head -1)/node_modules"; \
    cp -RL /tmp/prisma-client/. "$STORE/@prisma/client/"; \
    rm -rf "$STORE/.prisma"; cp -RL /tmp/dot-prisma "$STORE/.prisma"; \
    rm -rf /tmp/prisma-client /tmp/dot-prisma

# ---- runner: minimal production image ----
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3001
WORKDIR /app
RUN addgroup -S nodejs -g 1001 && adduser -S expressjs -u 1001

# Production-only dependency closure (api + shared; generated Prisma client).
COPY --from=assemble --chown=expressjs:nodejs /app/node_modules ./node_modules
COPY --from=assemble --chown=expressjs:nodejs /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=assemble --chown=expressjs:nodejs /app/packages/shared/node_modules ./packages/shared/node_modules

# Compiled output + runtime assets.
COPY --from=builder --chown=expressjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=expressjs:nodejs /app/apps/api/package.json ./apps/api/
COPY --from=builder --chown=expressjs:nodejs /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder --chown=expressjs:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=expressjs:nodejs /app/packages/shared/package.json ./packages/shared/

USER expressjs
WORKDIR /app/apps/api
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"
CMD ["node", "dist/main.js"]
