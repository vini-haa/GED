-- name: CreateInternalProtocol :one
INSERT INTO internal_protocols (
    protocol_number, year, sequence,
    subject, interested, sender, project_name,
    current_sector_code, current_sector_name,
    created_by_id, created_by_email, created_by_name
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
RETURNING *;

-- name: GetInternalProtocolByID :one
SELECT * FROM internal_protocols WHERE id = $1 AND is_deleted = FALSE;

-- name: ListInternalProtocols :many
SELECT * FROM internal_protocols
WHERE is_deleted = FALSE
  AND (sqlc.narg('sector_code')::INTEGER IS NULL OR current_sector_code = sqlc.narg('sector_code'))
  AND (sqlc.narg('status')::VARCHAR IS NULL OR status = sqlc.narg('status'))
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountInternalProtocols :one
SELECT COUNT(*) FROM internal_protocols
WHERE is_deleted = FALSE
  AND (sqlc.narg('sector_code')::INTEGER IS NULL OR current_sector_code = sqlc.narg('sector_code'))
  AND (sqlc.narg('status')::VARCHAR IS NULL OR status = sqlc.narg('status'));

-- name: UpdateInternalProtocol :one
UPDATE internal_protocols
SET subject = COALESCE(sqlc.narg('subject'), subject),
    interested = COALESCE(sqlc.narg('interested'), interested),
    sender = COALESCE(sqlc.narg('sender'), sender),
    project_name = COALESCE(sqlc.narg('project_name'), project_name)
WHERE id = $1 AND is_deleted = FALSE
RETURNING *;

-- name: UpdateInternalProtocolStatus :one
UPDATE internal_protocols
SET status = $2, cancel_reason = $3
WHERE id = $1 AND is_deleted = FALSE
RETURNING *;

-- name: UpdateInternalProtocolSector :exec
UPDATE internal_protocols
SET current_sector_code = $2, current_sector_name = $3
WHERE id = $1;

-- name: SoftDeleteInternalProtocol :one
UPDATE internal_protocols
SET is_deleted = TRUE, deleted_at = NOW(),
    deleted_by_email = $2, delete_reason = $3
WHERE id = $1 AND is_deleted = FALSE
RETURNING *;

-- name: GetNextSequence :one
SELECT COALESCE(MAX(sequence), 0) + 1 AS next_seq
FROM internal_protocols WHERE year = $1;

-- name: CountDocsByInternalProtocolIDs :many
SELECT protocolo_sagi, COUNT(*) AS doc_count
FROM documentos
WHERE protocolo_sagi = ANY($1::varchar[])
  AND deleted_at IS NULL
GROUP BY protocolo_sagi;

-- name: CountObsByInternalProtocolIDs :many
SELECT protocolo_sagi, COUNT(*) AS obs_count
FROM observacoes
WHERE protocolo_sagi = ANY($1::varchar[])
  AND deleted_at IS NULL
GROUP BY protocolo_sagi;

-- name: CountMovementsByProtocolID :one
SELECT COUNT(*) FROM internal_protocol_movements
WHERE protocol_id = $1;
