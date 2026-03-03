-- name: ListTiposDocumento :many
SELECT * FROM tipos_documento
WHERE ativo = true
ORDER BY nome;

-- name: GetTipoDocumentoByID :one
SELECT * FROM tipos_documento
WHERE id = $1;

-- name: CreateTipoDocumento :one
INSERT INTO tipos_documento (nome, descricao)
VALUES ($1, $2)
RETURNING *;

-- name: UpdateTipoDocumento :exec
UPDATE tipos_documento SET nome = $2, descricao = $3
WHERE id = $1;

-- name: DeactivateTipoDocumento :exec
UPDATE tipos_documento SET ativo = false
WHERE id = $1;

-- name: ActivateTipoDocumento :exec
UPDATE tipos_documento SET ativo = true
WHERE id = $1;

-- name: ListAllTiposDocumento :many
SELECT * FROM tipos_documento
ORDER BY nome;
