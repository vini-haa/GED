-- Adicionar colunas faltantes à tabela activity_logs existente
ALTER TABLE activity_logs
    ADD COLUMN IF NOT EXISTS user_agent VARCHAR(500),
    ADD COLUMN IF NOT EXISTS protocol_id INTEGER,
    ADD COLUMN IF NOT EXISTS protocol_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS protocol_source VARCHAR(20);

-- Índice para busca por protocol_id
CREATE INDEX IF NOT EXISTS idx_activity_logs_protocol_id ON activity_logs(protocol_id);
