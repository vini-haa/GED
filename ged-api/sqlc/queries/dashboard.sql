-- name: DashboardCountDocumentos :one
SELECT COUNT(*) FROM documentos
WHERE deleted_at IS NULL
  AND ($1::timestamp IS NULL OR uploaded_at >= $1)
  AND ($2::text = '' OR uploaded_by_name ILIKE '%' || $2 || '%');

-- name: DashboardCountObservacoes :one
SELECT COUNT(*) FROM observacoes
WHERE deleted_at IS NULL
  AND ($1::timestamp IS NULL OR criado_em >= $1);

-- name: DashboardUploadsPorDia :many
SELECT
    TO_CHAR(uploaded_at, 'YYYY-MM-DD') AS data,
    COUNT(*) AS total
FROM documentos
WHERE deleted_at IS NULL
  AND uploaded_at >= $1
GROUP BY TO_CHAR(uploaded_at, 'YYYY-MM-DD')
ORDER BY data;

-- name: DashboardProtocolosInternosPorDia :many
SELECT
    TO_CHAR(created_at, 'YYYY-MM-DD') AS data,
    COUNT(*) AS total
FROM internal_protocols
WHERE is_deleted = FALSE
  AND created_at >= $1
GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
ORDER BY data;

-- name: DashboardDocsPorTipo :many
SELECT
    COALESCE(td.nome, 'Sem tipo') AS tipo,
    COUNT(*) AS quantidade
FROM documentos d
LEFT JOIN tipos_documento td ON td.id = d.tipo_documento_id
WHERE d.deleted_at IS NULL
  AND ($1::timestamp IS NULL OR d.uploaded_at >= $1)
GROUP BY COALESCE(td.nome, 'Sem tipo')
ORDER BY quantidade DESC;

-- name: DashboardRankingUploads :many
SELECT
    COALESCE(d.uploaded_by_name, d.uploaded_by) AS nome,
    d.uploaded_by AS email,
    COUNT(*) AS uploads
FROM documentos d
WHERE d.deleted_at IS NULL
  AND ($1::timestamp IS NULL OR d.uploaded_at >= $1)
GROUP BY COALESCE(d.uploaded_by_name, d.uploaded_by), d.uploaded_by
ORDER BY uploads DESC
LIMIT $2;

-- name: DashboardProtocolosComDocs :many
SELECT DISTINCT protocolo_sagi FROM documentos
WHERE deleted_at IS NULL;
