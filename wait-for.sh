#!/bin/sh

echo "Waiting for PostgreSQL at $1..."
until nc -z "$1" "$2"; do
  sleep 1
done

echo "PostgreSQL is available – running Prisma and starting app"

npx prisma generate
node dist/main
