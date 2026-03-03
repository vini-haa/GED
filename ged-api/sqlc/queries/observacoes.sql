-- name: CreateObservacao :one
INSERT INTO observacoes (
    protocolo_sagi, protocol_id, protocol_source,
    texto, is_important,
    autor_email, autor_nome, autor_setor
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: ListObservacoesByProtocol :many
SELECT * FROM observacoes
WHERE protocol_id = $1 AND protocol_source = $2 AND deleted_at IS NULL
ORDER BY is_important DESC, criado_em DESC;

-- name: GetObservacaoByID :one
SELECT * FROM observacoes WHERE id = $1;

-- name: UpdateObservacaoContent :one
UPDATE observacoes SET texto = $2
WHERE id = $1 AND deleted_at IS NULL RETURNING *;

-- name: ToggleObservacaoImportant :one
UPDATE observacoes SET is_important = NOT is_important
WHERE id = $1 AND deleted_at IS NULL RETURNING *;

-- name: SoftDeleteObservacao :one
UPDATE observacoes
SET deleted_at = NOW(), deleted_by = $2
WHERE id = $1 AND deleted_at IS NULL RETURNING *;

-- name: CountRecentObservacoes :one
SELECT COUNT(*) FROM observacoes
WHERE protocol_id = $1 AND protocol_source = $2
  AND deleted_at IS NULL AND criado_em > NOW() - INTERVAL '48 hours';
