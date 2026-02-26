#!/bin/sh
set -e

BACKUP_DIR="/backups"

if [ -z "$1" ]; then
    echo "Uso: $0 <arquivo_backup>"
    echo ""
    echo "Backups disponíveis:"
    ls -lh "${BACKUP_DIR}"/ged_fadex_*.sql.gz 2>/dev/null || echo "  Nenhum backup encontrado"
    exit 1
fi

BACKUP_FILE="$1"

# Aceitar nome do arquivo ou caminho completo
if [ ! -f "${BACKUP_FILE}" ]; then
    BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILE}"
fi

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "Erro: arquivo '${1}' não encontrado"
    exit 1
fi

echo "[$(date --iso-8601=seconds)] Restaurando backup: ${BACKUP_FILE}"
echo "ATENÇÃO: Isso irá substituir TODOS os dados do banco ged_fadex!"
echo ""

gunzip -c "${BACKUP_FILE}" | psql --single-transaction --set ON_ERROR_STOP=on

echo "[$(date --iso-8601=seconds)] Restore concluído com sucesso"
