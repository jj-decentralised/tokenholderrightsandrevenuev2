FROM node:20-slim AS base

# Install dependencies using workspaces
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/web/package.json ./packages/web/
COPY tsconfig.base.json ./
RUN npm ci --omit=dev --workspace=packages/api

# Build the API
FROM base AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/api/ ./packages/api/
RUN npm ci --workspace=packages/api && \
    npm run build --workspace=packages/api

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/api/node_modules ./packages/api/node_modules
COPY --from=build /app/packages/api/dist ./packages/api/dist
COPY --from=build /app/packages/api/src/db/migrations ./packages/api/dist/db/migrations
COPY packages/api/package.json ./packages/api/
COPY package.json ./

EXPOSE 4000

CMD ["node", "packages/api/dist/server.js"]
