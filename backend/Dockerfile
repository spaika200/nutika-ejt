FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lock ./
COPY tsconfig.json ./
RUN bun install --no-frozen-lockfile

COPY prisma ./prisma
RUN bunx prisma generate

COPY src ./src
RUN bun run build

FROM oven/bun:1
WORKDIR /app

# Install ca-certificates and curl for HTTPS requests and healthchecks
RUN apt-get update && apt-get install -y ca-certificates curl && rm -rf /var/lib/apt/lists/*

COPY package.json ./
COPY --from=builder /app/bun.lock ./bun.lock
COPY prisma ./prisma
RUN bun install --production --no-frozen-lockfile
RUN bunx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 5000
CMD ["sh", "-c", "bunx prisma db push --accept-data-loss && (bun run dist/seed.js || true) && bun run dist/index.js"]
