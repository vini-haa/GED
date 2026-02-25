-- name: GetAdminByEmail :one
SELECT * FROM admins
WHERE email = $1 AND ativo = true;

-- name: ListAdmins :many
SELECT * FROM admins
ORDER BY criado_em DESC
LIMIT $1 OFFSET $2;

-- name: CreateAdmin :one
INSERT INTO admins (email, nome, role, criado_por)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: UpdateAdminRole :exec
UPDATE admins SET role = $2, atualizado_em = NOW()
WHERE id = $1;

-- name: DeactivateAdmin :exec
UPDATE admins SET ativo = false, atualizado_em = NOW()
WHERE id = $1;

-- name: CountAdmins :one
SELECT COUNT(*) FROM admins;
