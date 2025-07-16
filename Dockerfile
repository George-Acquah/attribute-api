# Stage 1: Development
FROM node:20-alpine as development
WORKDIR /usr/src/app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files (include pnpm-lock.yaml)
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm exec prisma generate

# Copy all source files
COPY . .

# Enable watch mode
ENV CHOKIDAR_USEPOLLING=true

# Use existing node user
USER node

# Use pnpm to run the dev command
CMD ["pnpm", "run", "start:dev"]

# Stage 2: Builder
FROM node:20-alpine as builder
WORKDIR /usr/src/app

# Copy from development stage
COPY --from=development /usr/src/app .

# Use pnpm for build
RUN pnpm run build

# Stage 3: Production
FROM node:20-alpine as production
WORKDIR /app

RUN apk add --no-cache bash netcat-openbsd

# Copy built files
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json .
COPY --from=builder /usr/src/app/prisma ./prisma

# Use pnpm to generate production client
RUN npx prisma generate

COPY wait-for.sh ./
RUN chmod +x wait-for.sh

EXPOSE 3300
CMD ["./wait-for.sh", "db:5432", "--", "node", "dist/main"]