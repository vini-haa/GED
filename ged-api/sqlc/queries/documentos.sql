-- name: ListDocumentosByProtocolo :many
SELECT * FROM documentos
WHERE protocolo_sagi = $1 AND deleted_at IS NULL
ORDER BY uploaded_at DESC;

-- name: GetDocumentoByID :one
SELECT * FROM documentos
WHERE id = $1 AND deleted_at IS NULL;

-- name: CreateDocumento :one
INSERT INTO documentos (
    protocolo_sagi, tipo_documento_id, nome_arquivo,
    drive_file_id, drive_file_url, tamanho_bytes,
    mime_type, hash_sha256, uploaded_by
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *;

-- name: SoftDeleteDocumento :exec
UPDATE documentos
SET deleted_at = NOW(), deleted_by = $2, motivo_exclusao = $3
WHERE id = $1;

-- name: CountDocumentosByProtocolo :one
SELECT COUNT(*) FROM documentos
WHERE protocolo_sagi = $1 AND deleted_at IS NULL;
