# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies. Aggressive fetch-retries so a transient ECONNRESET
# from the npm registry doesn't kill the build (single registry download).
RUN npm ci --no-audit --no-fund \
    --fetch-retries=5 \
    --fetch-retry-mintimeout=20000 \
    --fetch-retry-maxtimeout=120000 \
    --fetch-timeout=600000

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Reuse the dependencies already downloaded in the builder stage and drop
# devDependencies locally with `npm prune` — avoids a SECOND registry
# download (the previous `npm ci --omit=dev` was the step failing on
# ECONNRESET). prune is an offline operation.
COPY --from=builder /app/node_modules ./node_modules
RUN npm prune --omit=dev

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Default port (override at runtime, e.g. docker compose / .env PORT=4001)
EXPOSE 4001

ENV NODE_ENV=production
ENV PORT=4001

# Public GET /api/health — falla si faltan products/categories/banners.
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
    CMD ["node","-e","require('http').get('http://127.0.0.1:'+(process.env.PORT||4001)+'/api/health',(r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"]

# Entrypoint runs migrations (via DB_MIGRATIONS_RUN env) + seeders, then starts app
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
