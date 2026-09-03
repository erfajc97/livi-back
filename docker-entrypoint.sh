#!/bin/sh
set -e

SEEDER_PATH="dist/database/seeders/index.js"

if [ ! -f "$SEEDER_PATH" ]; then
  echo "ERROR: seeder not found at $SEEDER_PATH — build did not emit it. Aborting."
  exit 1
fi

echo "DB_HOST=${DB_HOST:-unset} DB_NAME=${DB_NAME:-unset} DB_SYNCHRONIZE=${DB_SYNCHRONIZE:-unset} DB_MIGRATIONS_RUN=${DB_MIGRATIONS_RUN:-unset}"
echo "Running database seeders (idempotent)..."
node "$SEEDER_PATH"

echo "Starting API..."
exec node dist/main
