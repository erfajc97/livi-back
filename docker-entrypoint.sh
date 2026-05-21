#!/bin/sh
set -e

echo "Running database seeders (idempotent, skips existing admin)..."
node dist/database/seeders/index.js || echo "Seeder finished with non-zero exit (continuing)"

echo "Starting API..."
exec node dist/main
