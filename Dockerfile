###################
# BASE WITH CHROMIUM (Debian)
###################
FROM node:20 AS base

# Install Chromium + deps (Render-friendly, no sandbox required)
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

# Puppeteer config: use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /usr/src/app


###################
# DEVELOPMENT
###################
FROM base AS development

COPY package.json pnpm-lock.yaml ./
COPY src/database ./src/database

RUN pnpm install

COPY . .

RUN pnpm run prisma:generate && chown -R node:node node_modules/.prisma

USER node


###################
# BUILD
###################
FROM base AS build

COPY package.json pnpm-lock.yaml ./
COPY src/database ./src/database
COPY --from=development /usr/src/app/node_modules ./node_modules
COPY . .

RUN pnpm run build


###################
# PRODUCTION (Alpine)
###################
FROM node:20-alpine AS production

# Install Chromium + deps for Alpine
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    libstdc++ \
    dumb-init

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml ./
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/src/database ./src/database

RUN pnpm run prisma:generate

USER node

CMD ["pnpm", "run", "start:migrate:prod"]
