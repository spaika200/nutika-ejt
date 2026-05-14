FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lock ./
COPY tsconfig.json ./
RUN bun install --frozen-lockfile

COPY prisma ./prisma
RUN bunx prisma generate

COPY src ./src
RUN bun run build

FROM oven/bun:1
WORKDIR /app

COPY package.json bun.lock ./
COPY prisma ./prisma
RUN bun install --production --frozen-lockfile
RUN bunx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 5000
CMD ["sh", "-c", "bunx prisma db push --accept-data-loss && bun run dist/seed.js && bun run dist/index.js"]
