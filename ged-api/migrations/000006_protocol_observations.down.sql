DROP TRIGGER IF EXISTS trg_observacoes_editado ON observacoes;
DROP FUNCTION IF EXISTS update_editado_em();
DROP INDEX IF EXISTS idx_observacoes_not_deleted;
DROP INDEX IF EXISTS idx_observacoes_protocol_id;
ALTER TABLE observacoes
    DROP COLUMN IF EXISTS autor_setor,
    DROP COLUMN IF EXISTS is_important,
    DROP COLUMN IF EXISTS protocol_source,
    DROP COLUMN IF EXISTS protocol_id;
