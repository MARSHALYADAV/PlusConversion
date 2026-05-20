# Use slim Node LTS base image for highly efficient hosting
FROM node:20-slim AS builder

WORKDIR /usr/src/app

COPY package*.json ./

# Install development and production packages
RUN npm ci

COPY . .

# Run build if esbuild compiles jsx bundles
RUN npm run build --if-present

# Create the final production-ready container to minimize image size
FROM node:20-slim

WORKDIR /usr/src/app

COPY package*.json ./

# Install production dependencies only to keep container extremely light
RUN npm ci --omit=dev

COPY --from=builder /usr/src/app/backend ./backend
COPY --from=builder /usr/src/app/frontend ./frontend
COPY --from=builder /usr/src/app/shared ./shared

# Create local temporary uploads transient directory
RUN mkdir -p temp_uploads

# Set runtime defaults
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
