# --- Stage 1: Build ---
FROM node:20-slim AS builder

WORKDIR /usr/src/app

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including devDependencies for TypeScript build)
RUN npm ci

# Copy source files
COPY tsconfig.json ./
COPY src ./src/

# Generate Prisma client and compile TypeScript
RUN npm run build

# Prune devDependencies to keep container lightweight
RUN npm prune --production

# --- Stage 2: Run ---
FROM node:20-slim AS runner

WORKDIR /usr/src/app

# Install openssl for Prisma runtime
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Set node environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary files from builder stage
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/src ./src
RUN touch .env

# Expose backend port
EXPOSE 3000

# Start server
CMD ["node", "dist/index.js"]
