# Stage 1: Build Frontend & Backend Server
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy project files
COPY . .

# Build Vite frontend and Bundle Express server.ts into dist/server.cjs
RUN npm run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package files and production node_modules
COPY package*.json ./
RUN npm ci --only=production

# Copy dist directory and public static assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Expose server port
EXPOSE 3000

# Start server
CMD ["node", "dist/server.cjs"]
