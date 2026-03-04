DROP INDEX IF EXISTS idx_observacoes_parent_id;
ALTER TABLE observacoes DROP COLUMN IF EXISTS parent_id;
