-- name: CreateActivityLog :exec
INSERT INTO activity_logs (
    acao, entidade, entidade_id, detalhes,
    usuario_email, usuario_nome, ip_address
) VALUES ($1, $2, $3, $4, $5, $6, $7);

-- name: ListActivityLogs :many
SELECT * FROM activity_logs
WHERE
    (sqlc.narg('entidade')::varchar IS NULL OR entidade = sqlc.narg('entidade'))
    AND (sqlc.narg('usuario_email')::varchar IS NULL OR usuario_email = sqlc.narg('usuario_email'))
    AND (sqlc.narg('desde')::timestamp IS NULL OR criado_em >= sqlc.narg('desde'))
    AND (sqlc.narg('ate')::timestamp IS NULL OR criado_em <= sqlc.narg('ate'))
ORDER BY criado_em DESC
LIMIT $1 OFFSET $2;
