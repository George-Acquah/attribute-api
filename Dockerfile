###################
# BUILD FOR LOCAL DEVELOPMENT
###################
FROM node:20 as development

RUN apt-get update && apt-get install -y openssl

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /usr/src/app

# Copy dependency manifests
COPY --chown=node:node package.json pnpm-lock.yaml ./

# Install dependencies for development
RUN pnpm install

# Copy application code
COPY --chown=node:node . .

# Generate Prisma client
RUN pnpm run prisma:generate && chown -R node:node node_modules/.prisma

# Use non-root user
USER node

###################
# BUILD FOR PRODUCTION
###################
FROM node:20-alpine as build

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm allow-scripts

WORKDIR /usr/src/app

COPY --chown=node:node package.json pnpm-lock.yaml ./

# Install deps (needed for prisma generate)
RUN pnpm install

# Copy node_modules from development stage
COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules
# Copy generated Prisma client
COPY --chown=node:node --from=development /usr/src/app/node_modules/.prisma ./node_modules/.prisma

# Copy app source
COPY --chown=node:node . .

RUN pnpm run prisma:generate

# Build the app
RUN pnpm run build

# Set production environment
ENV NODE_ENV production

# Reinstall only production dependencies
RUN rm -rf node_modules && pnpm install --prod --frozen-lockfile && pnpm store prune

USER node

###################
# PRODUCTION
###################
FROM node:20-alpine as production

# Enable pnpm (optional if not using pnpm in runtime)
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /usr/src/app

# Copy production-ready node_modules and built files
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

# Start the server
CMD ["node", "dist/main.js"]











# ###################
# # BUILD FOR LOCAL DEVELOPMENT
# ###################
# FROM node:20-alpine as development
# WORKDIR /usr/src/app

# # Install pnpm globally
# RUN npm install -g pnpm

# # Copy package files (include pnpm-lock.yaml)
# COPY --chown=node:node package.json pnpm-lock.yaml ./
# COPY prisma ./prisma

# # Install dependencies using pnpm
# RUN pnpm install --frozen-lockfile

# # Generate Prisma client
# RUN pnpm exec prisma generate

# # Copy all source files
# COPY --chown=node:node . .

# # Enable watch mode
# # ENV CHOKIDAR_USEPOLLING=true

# # Use existing node user
# USER node

# # Use pnpm to run the dev command
# CMD ["pnpm", "run", "start:dev"]

# ###################
# # BUILD FOR PRODUCTION
# ###################
# # Stage 2: Builder
# FROM node:20-alpine as builder
# WORKDIR /usr/src/app

# COPY --chown=node:node package.json pnpm-lock.yaml ./
# COPY prisma ./prisma

# # Copy from development stage
# COPY --chown=node:node --from=development /usr/src/app/node_modules  ./node_modules 

# COPY --chown=node:node . .

# # Use pnpm for build
# RUN pnpm run build

# # Set NODE_ENV environment variable
# ENV NODE_ENV production

# # Install only production dependencies with pnpm
# RUN pnpm install --frozen-lockfile --prod && pnpm store prune

# USER node

# ###################
# # PRODUCTION
# ###################
# FROM node:20-alpine as production
# WORKDIR /app

# RUN apk add --no-cache bash netcat-openbsd

# # Copy built files
# COPY --chown=node:node --from=builder /usr/src/app/dist ./dist
# COPY --chown=node:node --from=builder /usr/src/app/node_modules ./node_modules
# COPY --chown=node:node --from=builder /usr/src/app/package.json .
# COPY --chown=node:node --from=builder /usr/src/app/prisma ./prisma

# # Use pnpm to generate production client
# RUN npx prisma generate

# COPY wait-for.sh ./
# RUN chmod +x wait-for.sh

# EXPOSE 3300
# CMD ["./wait-for.sh", "db:5432", "--", "node", "dist/main"]