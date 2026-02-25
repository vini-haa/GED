-- name: ListObservacoesByProtocolo :many
SELECT * FROM observacoes
WHERE protocolo_sagi = $1 AND deleted_at IS NULL
ORDER BY criado_em DESC;

-- name: CreateObservacao :one
INSERT INTO observacoes (protocolo_sagi, texto, autor_email, autor_nome)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: UpdateObservacao :exec
UPDATE observacoes SET texto = $2, editado_em = NOW()
WHERE id = $1;

-- name: SoftDeleteObservacao :exec
UPDATE observacoes
SET deleted_at = NOW(), deleted_by = $2, motivo_exclusao = $3
WHERE id = $1;
