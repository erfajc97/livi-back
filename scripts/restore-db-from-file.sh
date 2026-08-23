#!/usr/bin/env bash
# Restaura un dump .sql / .sql.gz en el Postgres de Docker.
# NO hace compose down, NO usa -v, NO hace prune, NO recrea el volumen.
#
#   bash scripts/restore-db-from-file.sh /home/ubuntu/backups/backup-YYYYMMDD.sql
#   bash scripts/restore-db-from-file.sh /home/ubuntu/backups/backup-YYYYMMDD.sql.gz
#
set -euo pipefail

API_CONTAINER="${API_CONTAINER:-api-ecommerce}"
DB_CONTAINER="${DB_CONTAINER:-api-ecommerce-db}"
FILE="${1:-}"

fail() { echo "ERROR: $*" >&2; exit 1; }
[ -n "$FILE" ] && [ -f "$FILE" ] || fail "uso: $0 /ruta/al/dump.sql[.gz]"
docker inspect "$DB_CONTAINER" >/dev/null 2>&1 || fail "no existe $DB_CONTAINER"

DB_USER="$(docker exec "$DB_CONTAINER" printenv POSTGRES_USER 2>/dev/null || echo postgres)"
DB_NAME="$(docker exec "$API_CONTAINER" printenv DB_NAME 2>/dev/null || docker exec "$DB_CONTAINER" printenv POSTGRES_DB 2>/dev/null || echo postgres)"

echo "Parando SOLO $API_CONTAINER (Postgres sigue)"
docker stop "$API_CONTAINER" >/dev/null

echo "Restaurando $FILE → $DB_NAME"
if [[ "$FILE" == *.gz ]]; then
  gzip -dc "$FILE" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" >/tmp/restore-psql.log
else
  docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < "$FILE" >/tmp/restore-psql.log
fi

echo "Conteos:"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) AS productos FROM products;"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) AS users FROM users;"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) AS banners FROM banners;"

echo "Arrancando $API_CONTAINER"
docker start "$API_CONTAINER" >/dev/null
sleep 5
docker ps --filter "name=$API_CONTAINER" --format 'table {{.Names}}\t{{.Status}}'
echo "Log psql: /tmp/restore-psql.log"
