#!/usr/bin/env bash
#
# Dump diario de Postgres (contenedor Docker). NUNCA borra volúmenes:
# no hace compose down, ni prune, ni docker volume rm.
#
#   bash scripts/backup-db-daily.sh
#
# Local: ~/backups/backup-YYYYMMDD-HHMMSS.sql.gz (se conservan KEEP_DAYS).
# S3 (opcional): si en el .env del API está AWS_S3_BACKUP_BUCKET, sube el
# archivo a s3://$AWS_S3_BACKUP_BUCKET/${AWS_S3_BACKUP_PREFIX}backup-....gz
#
set -euo pipefail

API_CONTAINER="${API_CONTAINER:-api-ecommerce}"
DB_CONTAINER="${DB_CONTAINER:-api-ecommerce-db}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
ENV_FILE="${ENV_FILE:-/home/ubuntu/api-ecommerce-nestjs/.env}"
MIN_BYTES="${MIN_BYTES:-10240}"

fail() { echo "ERROR: $*" >&2; exit 1; }

command -v docker >/dev/null || fail "docker no está en el PATH"
docker inspect "$DB_CONTAINER" >/dev/null 2>&1 || fail "no existe $DB_CONTAINER — aborto sin tocar nada"

mkdir -p "$BACKUP_DIR"

DB_USER="$(docker exec "$DB_CONTAINER" printenv POSTGRES_USER 2>/dev/null || echo postgres)"
DB_NAME="$(docker exec "$API_CONTAINER" printenv DB_NAME 2>/dev/null || docker exec "$DB_CONTAINER" printenv POSTGRES_DB 2>/dev/null || echo postgres)"

STAMP="$(date +%Y%m%d-%H%M%S)"
RAW="$BACKUP_DIR/backup-$STAMP.sql"
GZ="$RAW.gz"

echo "$(date -Is) dump $DB_NAME@$DB_CONTAINER → $GZ"

docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" --no-owner --no-acl "$DB_NAME" > "$RAW"

BYTES="$(wc -c < "$RAW")"
[ "$BYTES" -gt "$MIN_BYTES" ] || fail "dump diminuto ($BYTES bytes). No se comprime ni se sube. Archivo: $RAW"

gzip -f "$RAW"
GZ_BYTES="$(wc -c < "$GZ")"
echo "OK local $(du -h "$GZ" | cut -f1) ($GZ_BYTES bytes)"

# Rotación local
find "$BACKUP_DIR" -maxdepth 1 -name 'backup-*.sql.gz' -mtime "+$KEEP_DAYS" -delete
find "$BACKUP_DIR" -maxdepth 1 -name 'backup-*.sql' -mtime "+$KEEP_DAYS" -delete

env_val() {
  [ -f "$ENV_FILE" ] || return 0
  grep -E "^$1=" "$ENV_FILE" | tail -1 | cut -d= -f2- | tr -d '"' | tr -d "'"
}

BUCKET="$(env_val AWS_S3_BACKUP_BUCKET)"
PREFIX="$(env_val AWS_S3_BACKUP_PREFIX)"
PREFIX="${PREFIX:-db-backups/postgres/}"
REGION="$(env_val AWS_REGION)"
REGION="${REGION:-us-east-1}"
AWS_ACCESS_KEY_ID="$(env_val AWS_ACCESS_KEY_ID)"
AWS_SECRET_ACCESS_KEY="$(env_val AWS_SECRET_ACCESS_KEY)"

if [ -z "${BUCKET:-}" ]; then
  echo "S3 omitido: falta AWS_S3_BACKUP_BUCKET en $ENV_FILE (el dump local quedó igual)."
  exit 0
fi

if [ -z "${AWS_ACCESS_KEY_ID:-}" ] || [ -z "${AWS_SECRET_ACCESS_KEY:-}" ]; then
  fail "AWS_S3_BACKUP_BUCKET está definido pero faltan AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY"
fi

KEY="${PREFIX}backup-$STAMP.sql.gz"
echo "Subiendo s3://$BUCKET/$KEY"

docker run --rm \
  -e AWS_ACCESS_KEY_ID \
  -e AWS_SECRET_ACCESS_KEY \
  -e AWS_DEFAULT_REGION="$REGION" \
  -v "$BACKUP_DIR:/backup:ro" \
  public.ecr.aws/aws-cli/aws-cli:latest \
  s3 cp "/backup/backup-$STAMP.sql.gz" "s3://$BUCKET/$KEY"

echo "OK s3://$BUCKET/$KEY"
