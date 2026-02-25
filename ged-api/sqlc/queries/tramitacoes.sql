-- name: ListTramitacoesByProtocolo :many
SELECT * FROM tramitacoes
WHERE protocolo_interno_id = $1
ORDER BY tramitado_em DESC;

-- name: CreateTramitacao :one
INSERT INTO tramitacoes (
    protocolo_interno_id, de_setor, para_setor,
    despacho, tramitado_por_email, tramitado_por_nome
) VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;
