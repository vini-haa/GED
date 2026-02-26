#!/bin/sh
set -e

BACKUP_DIR="/backups"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="ged_fadex_${TIMESTAMP}.sql.gz"

echo "[$(date --iso-8601=seconds)] Iniciando backup..."

pg_dump \
    --no-owner \
    --no-privileges \
    --format=plain \
    | gzip > "${BACKUP_DIR}/${FILENAME}"

SIZE=$(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1)
echo "[$(date --iso-8601=seconds)] Backup concluído: ${FILENAME} (${SIZE})"

# Remover backups com mais de N dias
DELETED=$(find "${BACKUP_DIR}" -name "ged_fadex_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -print -delete | wc -l)
if [ "$DELETED" -gt 0 ]; then
    echo "[$(date --iso-8601=seconds)] ${DELETED} backup(s) antigo(s) removido(s) (>${RETENTION_DAYS} dias)"
fi

echo "[$(date --iso-8601=seconds)] Backup finalizado com sucesso"
