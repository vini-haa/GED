-- 000001_initial_schema.down.sql
-- Drop na ordem inversa respeitando foreign keys

DROP TABLE IF EXISTS cache_email_setor;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS tramitacoes;
DROP TABLE IF EXISTS protocolos_internos;
DROP TABLE IF EXISTS observacoes;
DROP TABLE IF EXISTS documentos;
DROP TABLE IF EXISTS tipos_documento;
DROP TABLE IF EXISTS admins;
