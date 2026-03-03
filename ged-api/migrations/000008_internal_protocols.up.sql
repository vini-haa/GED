-- Tabela de protocolos internos do GED
CREATE TABLE IF NOT EXISTS internal_protocols (
    id SERIAL PRIMARY KEY,
    protocol_number VARCHAR(20) NOT NULL UNIQUE,  -- GED-2026-0001
    year INTEGER NOT NULL,
    sequence INTEGER NOT NULL,

    -- Campos obrigatórios
    subject VARCHAR(500) NOT NULL,
    interested VARCHAR(200) NOT NULL,
    sender VARCHAR(200) NOT NULL,
    project_name VARCHAR(300) NOT NULL,

    -- Setor atual
    current_sector_code INTEGER NOT NULL,
    current_sector_name VARCHAR(200) NOT NULL,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'aberto'
        CHECK (status IN ('aberto', 'em_analise', 'finalizado', 'arquivado', 'cancelado')),
    cancel_reason VARCHAR(500),

    -- Auditoria
    created_by_id VARCHAR(50) NOT NULL,
    created_by_email VARCHAR(200) NOT NULL,
    created_by_name VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Soft delete
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    deleted_by_email VARCHAR(200),
    delete_reason VARCHAR(500),

    UNIQUE(year, sequence)
);

CREATE INDEX IF NOT EXISTS idx_internal_protocols_number ON internal_protocols(protocol_number);
CREATE INDEX IF NOT EXISTS idx_internal_protocols_sector ON internal_protocols(current_sector_code);
CREATE INDEX IF NOT EXISTS idx_internal_protocols_status ON internal_protocols(status);
CREATE INDEX IF NOT EXISTS idx_internal_protocols_created ON internal_protocols(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_internal_protocols_not_deleted ON internal_protocols(id) WHERE is_deleted = FALSE;

-- Reutiliza a função update_updated_at() já existente (migration 001)
CREATE TRIGGER trg_internal_protocols_updated
    BEFORE UPDATE ON internal_protocols
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
