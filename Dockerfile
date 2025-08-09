###################
# BUILD FOR LOCAL DEVELOPMENT
###################
FROM node:20 AS development

# Install Chrome dependencies & Chromium
RUN apt-get update && apt-get install -y openssl \
    chromium \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxkbcommon0 \
    libxshmfence1 \
    xdg-utils \
 && rm -rf /var/lib/apt/lists/*

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /usr/src/app

# Copy dependency manifests
COPY --chown=node:node package.json pnpm-lock.yaml ./

# Copy only the prisma schema to allow generate early
COPY --chown=node:node src/database ./src/database

# Install dev dependencies
RUN pnpm install

# Copy the rest of the application
COPY --chown=node:node . .

# Generate Prisma client
RUN pnpm run prisma:generate && chown -R node:node node_modules/.prisma

COPY wait-for.sh ./
RUN chmod +x wait-for.sh

# Use non-root user for development
USER node

###################
# BUILD FOR PRODUCTION
###################
FROM node:20-alpine AS build

# Install Chromium for build-time Puppeteer use (if needed)
RUN apt-get update && apt-get install -y \
    chromium \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxkbcommon0 \
    libxshmfence1 \
    xdg-utils \
 && rm -rf /var/lib/apt/lists/*

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /usr/src/app

COPY --chown=node:node package.json pnpm-lock.yaml ./
COPY --chown=node:node src/database ./src/database

# Copy dev node_modules
COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules

# Copy app source
COPY --chown=node:node . .

# Build the app
RUN pnpm run build


# Set environment
ENV NODE_ENV production

# Install only production dependencies
RUN rm -rf node_modules && pnpm install --prod --frozen-lockfile && pnpm store prune

USER node

###################
# PRODUCTION
###################
FROM node:20-alpine AS production

# Install Chromium for build-time Puppeteer use (if needed)
RUN apt-get update && apt-get install -y \
    chromium \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxkbcommon0 \
    libxshmfence1 \
    xdg-utils \
 && rm -rf /var/lib/apt/lists/*

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /usr/src/app

# Copy production-ready assets
COPY --chown=node:node package.json pnpm-lock.yaml ./
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
COPY --chown=node:node --from=build /usr/src/app/src/database ./src/database

# Generate Prisma client for runtime
RUN pnpm run prisma:generate

# Let Puppeteer know where Chromium is
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Start the app with migration
CMD ["pnpm", "run", "start:migrate:prod"]