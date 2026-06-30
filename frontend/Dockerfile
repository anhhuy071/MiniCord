# --- Stage 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and config files
COPY . .

# Build the React application
RUN npm run build

# --- Stage 2: Serve ---
FROM nginx:alpine

# Copy build artifacts to Nginx html directory
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose Nginx port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
