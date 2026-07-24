FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DOCKER=1
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# KALICI VERI: rezervasyon/lead/ayar dosyalari konteyner icinde DEGIL,
# /app/data'ya baglanan volume uzerinde durur. Imajdaki kopya sadece
# ilk acilista tohum olarak kullanilir (bkz. scripts/docker-entrypoint.mjs).
COPY --from=builder /app/data ./data-seed
COPY --from=builder /app/scripts/docker-entrypoint.mjs ./docker-entrypoint.mjs
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data
ENV DATA_DIR=/app/data
VOLUME ["/app/data"]

USER nextjs
EXPOSE 3000
CMD ["node", "docker-entrypoint.mjs"]
