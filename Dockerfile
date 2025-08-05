# Multi-stage Docker build for ScheduleBud on Northflank
# Optimized for security, performance, and minimal attack surface

# Build stage
FROM node:18-alpine AS build

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S schedulebudapp -u 1001

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies with security optimizations
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force

# Copy source code
COPY --chown=schedulebudapp:nodejs . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:1.25-alpine AS production

# Install security updates and remove unnecessary packages
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# Remove default nginx config and content
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*

# Copy built application from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy security.txt
COPY --from=build /app/public/security.txt /usr/share/nginx/html/.well-known/security.txt

# Create nginx user and set permissions
RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001 -G nginx && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chmod -R 755 /usr/share/nginx/html

# Create necessary directories with proper permissions
RUN mkdir -p /var/run/nginx && \
    chown nginx:nginx /var/run/nginx

# Switch to non-root user
USER nginx

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# Expose port
EXPOSE 80

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Security labels
LABEL security.scan="enabled" \
      security.policy="restricted" \
      maintainer="security@schedulebudapp.com" \
      version="1.0.0" \
      description="ScheduleBud - Secure student task management app"