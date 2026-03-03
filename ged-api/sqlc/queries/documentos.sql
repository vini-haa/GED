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
    mime_type, hash_sha256, uploaded_by,
    descricao, uploaded_by_name, google_drive_folder_id
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
RETURNING *;

-- name: SoftDeleteDocumento :exec
UPDATE documentos
SET deleted_at = NOW(), deleted_by = $2, motivo_exclusao = $3
WHERE id = $1;

-- name: CountDocumentosByProtocolo :one
SELECT COUNT(*) FROM documentos
WHERE protocolo_sagi = $1 AND deleted_at IS NULL;

-- name: ListDocumentosByProtocoloWithType :many
SELECT
    d.id, d.protocolo_sagi, d.tipo_documento_id, d.nome_arquivo,
    d.drive_file_id, d.drive_file_url, d.tamanho_bytes, d.mime_type,
    d.hash_sha256, d.uploaded_by, d.uploaded_at, d.deleted_at, d.deleted_by,
    d.motivo_exclusao, d.descricao, d.uploaded_by_name, d.google_drive_folder_id,
    COALESCE(td.nome, '') AS tipo_documento_nome
FROM documentos d
LEFT JOIN tipos_documento td ON td.id = d.tipo_documento_id
WHERE d.protocolo_sagi = $1 AND d.deleted_at IS NULL
ORDER BY d.uploaded_at DESC;

-- name: GetDocumentoByIDWithType :one
SELECT
    d.id, d.protocolo_sagi, d.tipo_documento_id, d.nome_arquivo,
    d.drive_file_id, d.drive_file_url, d.tamanho_bytes, d.mime_type,
    d.hash_sha256, d.uploaded_by, d.uploaded_at, d.deleted_at, d.deleted_by,
    d.motivo_exclusao, d.descricao, d.uploaded_by_name, d.google_drive_folder_id,
    COALESCE(td.nome, '') AS tipo_documento_nome
FROM documentos d
LEFT JOIN tipos_documento td ON td.id = d.tipo_documento_id
WHERE d.id = $1 AND d.deleted_at IS NULL;

-- name: UpdateDocumentoMetadata :exec
UPDATE documentos
SET
    descricao = COALESCE(sqlc.narg('descricao'), descricao),
    tipo_documento_id = COALESCE(sqlc.narg('tipo_documento_id'), tipo_documento_id)
WHERE id = $1 AND deleted_at IS NULL;

-- name: CountObservacoesByProtocolo :one
SELECT COUNT(*) FROM observacoes
WHERE protocolo_sagi = $1 AND deleted_at IS NULL;
