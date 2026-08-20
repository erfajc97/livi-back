#!/usr/bin/env bash
#
# Limpieza de datos de prueba en el servidor, de una sola corrida:
#   1. backup de la base (pg_dump) en ~/backups/
#   2. reporte dry-run de lo que se va a borrar
#   3. confirmación manual escribiendo BORRAR
#   4. borrado real (transacción: si algo falla, ROLLBACK)
#
# Uso (dentro del server, en ~/api-ecommerce-nestjs):
#   bash scripts/limpiar-prod.sh
#
# Desde tu máquina, en un solo comando:
#   ssh -t ubuntu@<IP> "cd ~/api-ecommerce-nestjs && git pull && bash scripts/limpiar-prod.sh"
#
# Flags: se pasan tal cual a cleanup-prod-data.cjs, p. ej.
#   bash scripts/limpiar-prod.sh --keep=otro@mail.com --wipe-subscribers
#   bash scripts/limpiar-prod.sh --find=turathi          # solo busca, no borra
#   bash scripts/limpiar-prod.sh --products=41           # borra ademas ese producto
set -euo pipefail

API_CONTAINER="${API_CONTAINER:-api-ecommerce}"
DB_CONTAINER="${DB_CONTAINER:-api-ecommerce-db}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CJS="$SCRIPT_DIR/cleanup-prod-data.cjs"
EXTRA_ARGS=("$@")

fail() { echo "ERROR: $*" >&2; exit 1; }

[ -f "$CJS" ] || fail "no encuentro $CJS (haz git pull en el server)"
command -v docker >/dev/null || fail "docker no esta en el PATH"
docker inspect "$API_CONTAINER" >/dev/null 2>&1 || fail "no existe el contenedor $API_CONTAINER (ajusta API_CONTAINER=...)"
docker inspect "$DB_CONTAINER"  >/dev/null 2>&1 || fail "no existe el contenedor $DB_CONTAINER (ajusta DB_CONTAINER=...)"

DB_USER="$(docker exec "$DB_CONTAINER" printenv POSTGRES_USER 2>/dev/null || echo postgres)"
DB_NAME="$(docker exec "$DB_CONTAINER" printenv POSTGRES_DB   2>/dev/null || echo postgres)"

# --- modo solo-busqueda: no toca nada, no hace backup -----------------------
for arg in "${EXTRA_ARGS[@]:-}"; do
  case "$arg" in
    --find=*)
      docker cp "$CJS" "$API_CONTAINER:/tmp/cleanup.cjs" >/dev/null
      docker exec "$API_CONTAINER" node /tmp/cleanup.cjs "${EXTRA_ARGS[@]}"
      exit 0
      ;;
  esac
done

# --- 1. backup --------------------------------------------------------------
BACKUP_DIR="$HOME/backups"
mkdir -p "$BACKUP_DIR"
BACKUP="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).sql"
echo ">> Backup de $DB_NAME -> $BACKUP"
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP"

BACKUP_SIZE=$(wc -c < "$BACKUP")
[ "$BACKUP_SIZE" -gt 10240 ] || fail "el backup salio vacio o diminuto ($BACKUP_SIZE bytes). Abortado, no se borro nada."
echo ">> Backup OK ($(du -h "$BACKUP" | cut -f1))"

# --- 2. reporte -------------------------------------------------------------
echo
docker cp "$CJS" "$API_CONTAINER:/tmp/cleanup.cjs" >/dev/null
docker exec "$API_CONTAINER" node /tmp/cleanup.cjs "${EXTRA_ARGS[@]:-}"

# --- 3. confirmacion --------------------------------------------------------
echo
echo "Esto BORRA de forma permanente lo listado arriba."
echo "Restaurar solo es posible con: $BACKUP"
printf "Escribe BORRAR para continuar (cualquier otra cosa cancela): "
read -r ANSWER < /dev/tty || ANSWER=""
if [ "$ANSWER" != "BORRAR" ]; then
  echo "Cancelado. No se borro nada."
  exit 0
fi

# --- 4. borrado -------------------------------------------------------------
echo
docker exec "$API_CONTAINER" node /tmp/cleanup.cjs --apply "${EXTRA_ARGS[@]:-}"
docker exec "$API_CONTAINER" rm -f /tmp/cleanup.cjs || true

echo
echo ">> Listo. Backup previo guardado en: $BACKUP"
echo ">> Recuerda revisar el stock en el admin: borrar ordenes no devuelve el stock descontado."
