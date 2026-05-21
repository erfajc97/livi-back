# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

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

# Public GET /api/settings (JwtAuthGuard skips @Public routes). Honors PORT at runtime.
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
    CMD ["node","-e","require('http').get('http://127.0.0.1:'+(process.env.PORT||4001)+'/api/settings',(r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"]

# Entrypoint runs migrations (via DB_MIGRATIONS_RUN env) + seeders, then starts app
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
