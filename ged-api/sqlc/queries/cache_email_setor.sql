-- name: GetSetorByEmail :one
SELECT * FROM cache_email_setor
WHERE email = $1;

-- name: UpsertCacheEmailSetor :exec
INSERT INTO cache_email_setor (email, setor, nome)
VALUES ($1, $2, $3)
ON CONFLICT (email) DO UPDATE
SET setor = EXCLUDED.setor, nome = EXCLUDED.nome, atualizado_em = NOW();

-- name: ListCacheEmailSetor :many
SELECT * FROM cache_email_setor
ORDER BY nome;
