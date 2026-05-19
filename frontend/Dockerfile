FROM oven/bun:1-alpine AS builder
WORKDIR /app

ARG VITE_API_URL=http://localhost:5000
ARG VITE_APP_NAME=Nutika Elektrivõrgu Juhtimiskeskus

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_APP_NAME=${VITE_APP_NAME}

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
