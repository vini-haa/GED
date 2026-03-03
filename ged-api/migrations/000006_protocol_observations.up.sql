-- Adicionar colunas faltantes à tabela observacoes existente
ALTER TABLE observacoes
    ADD COLUMN IF NOT EXISTS protocol_id INTEGER,
    ADD COLUMN IF NOT EXISTS protocol_source VARCHAR(20) DEFAULT 'sagi',
    ADD COLUMN IF NOT EXISTS is_important BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS autor_setor VARCHAR(200);

-- Índice para busca por protocol_id + source
CREATE INDEX IF NOT EXISTS idx_observacoes_protocol_id ON observacoes(protocol_id, protocol_source);
CREATE INDEX IF NOT EXISTS idx_observacoes_not_deleted ON observacoes(protocol_id) WHERE deleted_at IS NULL;

-- Trigger para auto-update editado_em
CREATE OR REPLACE FUNCTION update_editado_em()
RETURNS TRIGGER AS $$
BEGIN
    NEW.editado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_observacoes_editado ON observacoes;
CREATE TRIGGER trg_observacoes_editado
    BEFORE UPDATE ON observacoes
    FOR EACH ROW EXECUTE FUNCTION update_editado_em();
