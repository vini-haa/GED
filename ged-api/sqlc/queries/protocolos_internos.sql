-- name: ListProtocolosInternos :many
SELECT * FROM protocolos_internos
WHERE
    (sqlc.narg('status')::varchar IS NULL OR status = sqlc.narg('status'))
    AND (sqlc.narg('setor_origem')::varchar IS NULL OR setor_origem = sqlc.narg('setor_origem'))
    AND (sqlc.narg('busca')::varchar IS NULL OR assunto ILIKE '%' || sqlc.narg('busca') || '%')
ORDER BY criado_em DESC
LIMIT $1 OFFSET $2;

-- name: GetProtocoloInternoByID :one
SELECT * FROM protocolos_internos
WHERE id = $1;

-- name: GetProtocoloInternoByNumero :one
SELECT * FROM protocolos_internos
WHERE numero = $1;

-- name: CreateProtocoloInterno :one
INSERT INTO protocolos_internos (
    numero, assunto, descricao, setor_origem,
    criado_por_email, criado_por_nome
) VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: UpdateStatusProtocoloInterno :exec
UPDATE protocolos_internos
SET status = $2, atualizado_em = NOW()
WHERE id = $1;

-- name: GetNextNumeroProtocolo :one
SELECT COALESCE(
    MAX(CAST(SPLIT_PART(numero, '-', 3) AS INTEGER)),
    0
) + 1 AS proximo
FROM protocolos_internos
WHERE numero LIKE 'GED-' || TO_CHAR(NOW(), 'YYYY') || '-%';
