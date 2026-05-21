#!/bin/sh
set -e

SEEDER_PATH="dist/database/seeders/index.js"

if [ ! -f "$SEEDER_PATH" ]; then
  echo "ERROR: seeder not found at $SEEDER_PATH — build did not emit it. Aborting."
  exit 1
fi

echo "Running database seeders (idempotent)..."
node "$SEEDER_PATH"

echo "Starting API..."
exec node dist/main
