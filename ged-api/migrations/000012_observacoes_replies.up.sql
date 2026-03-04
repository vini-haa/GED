ALTER TABLE observacoes
    ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES observacoes(id);

CREATE INDEX IF NOT EXISTS idx_observacoes_parent_id ON observacoes(parent_id) WHERE parent_id IS NOT NULL;
