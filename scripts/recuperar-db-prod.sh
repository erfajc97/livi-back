#!/usr/bin/env bash
#
# Recupera el API de producción cuando dice "relation does not exist".
# NO borra datos. NO recrea Postgres. NO activa synchronize.
#
#   bash scripts/recuperar-db-prod.sh           # diagnostica
#   bash scripts/recuperar-db-prod.sh --apply   # apunta DB_NAME a la base con productos y recrea SOLO el API
#
set -euo pipefail

API_CONTAINER="${API_CONTAINER:-api-ecommerce}"
DB_CONTAINER="${DB_CONTAINER:-api-ecommerce-db}"
APPLY=0
[[ "${1:-}" == "--apply" ]] && APPLY=1

fail() { echo "ERROR: $*" >&2; exit 1; }

command -v docker >/dev/null || fail "docker no está en el PATH"
docker inspect "$API_CONTAINER" >/dev/null 2>&1 || fail "no existe $API_CONTAINER"
docker inspect "$DB_CONTAINER" >/dev/null 2>&1 || fail "no existe $DB_CONTAINER"

API_DB="$(docker exec "$API_CONTAINER" printenv DB_NAME 2>/dev/null || true)"
DB_USER="$(docker exec "$DB_CONTAINER" printenv POSTGRES_USER)"
POSTGRES_DB="$(docker exec "$DB_CONTAINER" printenv POSTGRES_DB)"
COMPOSE_DIR="$(docker inspect "$API_CONTAINER" --format '{{index .Config.Labels "com.docker.compose.project.working_dir"}}' 2>/dev/null || true)"

echo "API  DB_NAME=${API_DB:-unset}"
echo "PG   POSTGRES_USER=$DB_USER  POSTGRES_DB=$POSTGRES_DB"
echo "DIR  ${COMPOSE_DIR:-desconocido}"
echo

BEST_DB=""
BEST_COUNT=0

echo "===== bases y tabla products ====="
while read -r db; do
  [[ -z "$db" ]] && continue
  info="$(
    docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$db" -tAc \
      "SELECT CASE WHEN to_regclass('public.products') IS NULL THEN 'NO|0' ELSE 'YES|' || (SELECT COUNT(*)::text FROM products) END" \
      2>/dev/null || echo "ERR|0"
  )"
  has="${info%%|*}"
  count="${info##*|}"
  echo "  $db  products=$has  count=$count"
  if [[ "$has" == "YES" && "$count" =~ ^[0-9]+$ && "$count" -gt "$BEST_COUNT" ]]; then
    BEST_DB="$db"
    BEST_COUNT="$count"
  fi
done < <(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d postgres -tAc \
  "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY 1")

echo

if [[ -n "$BEST_DB" ]]; then
  echo "Catálogo encontrado: base '$BEST_DB' con $BEST_COUNT productos."
  if [[ "$BEST_DB" == "$API_DB" ]]; then
    echo "El API ya apunta a esa base. Si igual falla, es search_path o el proceso quedó con un pool viejo:"
    echo "  docker restart $API_CONTAINER"
    exit 0
  fi
  echo "El API apunta a '${API_DB:-unset}', que NO es donde están los productos."
  if [[ "$APPLY" -ne 1 ]]; then
    echo
    echo "Para corregirlo (solo recrea el API, NO toca Postgres):"
    echo "  bash scripts/recuperar-db-prod.sh --apply"
    exit 0
  fi
  [[ -n "$COMPOSE_DIR" && -d "$COMPOSE_DIR" ]] || fail "no encuentro el directorio de compose. Exporta COMPOSE_DIR=..."
  ENV_FILE="$COMPOSE_DIR/.env"
  [[ -f "$ENV_FILE" ]] || fail "no existe $ENV_FILE"
  cp -a "$ENV_FILE" "$ENV_FILE.bak.$(date +%Y%m%d-%H%M%S)"
  if grep -q '^DB_NAME=' "$ENV_FILE"; then
    sed -i "s|^DB_NAME=.*|DB_NAME=$BEST_DB|" "$ENV_FILE"
  else
    echo "DB_NAME=$BEST_DB" >> "$ENV_FILE"
  fi
  echo "DB_NAME=$BEST_DB escrito en $ENV_FILE"
  if docker compose version >/dev/null 2>&1; then
    (cd "$COMPOSE_DIR" && docker compose up -d api --force-recreate --no-deps)
  else
    (cd "$COMPOSE_DIR" && docker-compose up -d api --force-recreate --no-deps)
  fi
  echo
  echo "Listo. Verifica: docker ps --filter name=$API_CONTAINER"
  echo "Y: curl -sS http://127.0.0.1:4001/api/health || curl -sS http://127.0.0.1:4001/api/settings"
  exit 0
fi

echo "No hay tabla products en NINGUNA base. Los datos no están en este Postgres."
echo "No recrees el volumen. Busca un dump:"
echo "  ls -lah ~/backups 2>/dev/null"
echo "Restaurar (ajusta el archivo y la base destino):"
echo "  docker exec -i $DB_CONTAINER psql -U $DB_USER -d ${API_DB:-$POSTGRES_DB} < ~/backups/EL_DUMP.sql"
echo "  docker restart $API_CONTAINER"
exit 1
