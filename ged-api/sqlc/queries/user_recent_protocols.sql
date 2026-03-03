-- name: UpsertRecentProtocol :exec
INSERT INTO user_recent_protocols (user_email, protocol_id, protocol_type, last_viewed_at, view_count)
VALUES ($1, $2, $3, NOW(), 1)
ON CONFLICT (user_email, protocol_id, protocol_type)
DO UPDATE SET last_viewed_at = NOW(), view_count = user_recent_protocols.view_count + 1;

-- name: ListRecentProtocols :many
SELECT * FROM user_recent_protocols
WHERE user_email = $1
ORDER BY last_viewed_at DESC
LIMIT $2;

-- name: CountDocsByProtocoloIDs :many
SELECT protocolo_sagi, COUNT(*) AS doc_count
FROM documentos
WHERE protocolo_sagi = ANY($1::varchar[])
  AND deleted_at IS NULL
GROUP BY protocolo_sagi;

-- name: HasRecentObservations :many
SELECT protocolo_sagi, COUNT(*) AS obs_count
FROM observacoes
WHERE protocolo_sagi = ANY($1::varchar[])
  AND deleted_at IS NULL
  AND criado_em >= NOW() - INTERVAL '48 hours'
GROUP BY protocolo_sagi;

-- name: CountDocsByProtocoloIDsForSetor :one
SELECT COUNT(*)
FROM documentos
WHERE protocolo_sagi = ANY($1::varchar[])
  AND deleted_at IS NULL;

-- name: SearchProtocolosInternos :many
SELECT id, numero, assunto, descricao, status, setor_origem, criado_por_email, criado_por_nome, criado_em, atualizado_em
FROM protocolos_internos
WHERE (numero ILIKE '%' || $1 || '%' OR assunto ILIKE '%' || $1 || '%')
ORDER BY criado_em DESC
LIMIT $2;

-- name: CountProtocolosInternos :one
SELECT COUNT(*)
FROM protocolos_internos
WHERE
    (sqlc.narg('status')::varchar IS NULL OR status = sqlc.narg('status'))
    AND (sqlc.narg('setor_origem')::varchar IS NULL OR setor_origem = sqlc.narg('setor_origem'))
    AND (sqlc.narg('busca')::varchar IS NULL OR assunto ILIKE '%' || sqlc.narg('busca') || '%');
