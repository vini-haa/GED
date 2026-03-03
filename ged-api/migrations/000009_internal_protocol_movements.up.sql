CREATE TABLE IF NOT EXISTS internal_protocol_movements (
    id SERIAL PRIMARY KEY,
    protocol_id INTEGER NOT NULL REFERENCES internal_protocols(id),

    -- Movimentação
    sequence INTEGER NOT NULL,
    from_sector_code INTEGER,
    from_sector_name VARCHAR(200),
    to_sector_code INTEGER NOT NULL,
    to_sector_name VARCHAR(200) NOT NULL,
    dispatch_note TEXT NOT NULL,

    -- Quem tramitou
    moved_by_id VARCHAR(50) NOT NULL,
    moved_by_email VARCHAR(200) NOT NULL,
    moved_by_name VARCHAR(200),
    moved_at TIMESTAMPTZ DEFAULT NOW(),

    is_current BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_movements_protocol ON internal_protocol_movements(protocol_id);
CREATE INDEX IF NOT EXISTS idx_movements_current ON internal_protocol_movements(protocol_id) WHERE is_current = TRUE;
