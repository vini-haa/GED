-- name: CreateMovement :one
INSERT INTO internal_protocol_movements (
    protocol_id, sequence,
    from_sector_code, from_sector_name,
    to_sector_code, to_sector_name,
    dispatch_note,
    moved_by_id, moved_by_email, moved_by_name
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;

-- name: ListMovementsByProtocol :many
SELECT * FROM internal_protocol_movements
WHERE protocol_id = $1
ORDER BY sequence DESC;

-- name: GetCurrentMovement :one
SELECT * FROM internal_protocol_movements
WHERE protocol_id = $1 AND is_current = TRUE
ORDER BY sequence DESC LIMIT 1;

-- name: ClearCurrentFlag :exec
UPDATE internal_protocol_movements
SET is_current = FALSE
WHERE protocol_id = $1 AND is_current = TRUE;

-- name: GetNextMovementSequence :one
SELECT COALESCE(MAX(sequence), 0) + 1 AS next_seq
FROM internal_protocol_movements WHERE protocol_id = $1;
