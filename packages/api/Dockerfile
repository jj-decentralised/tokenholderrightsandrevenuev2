FROM node:20-slim AS base

# Install dependencies only
FROM base AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev

# Build
FROM base AS build
WORKDIR /app
COPY package.json tsconfig.json ./
COPY src/ ./src/
RUN npm install && npm run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/db/migrations ./dist/db/migrations
COPY package.json ./

EXPOSE 4000

CMD ["node", "dist/server.js"]
