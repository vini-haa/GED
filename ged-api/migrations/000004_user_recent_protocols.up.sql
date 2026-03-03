-- 000004_user_recent_protocols.up.sql
-- Tabela de protocolos recentes visualizados pelo usuário

CREATE TABLE user_recent_protocols (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    protocol_id VARCHAR(50) NOT NULL,
    protocol_type VARCHAR(10) NOT NULL DEFAULT 'sagi' CHECK (protocol_type IN ('sagi', 'interno')),
    last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    view_count INTEGER NOT NULL DEFAULT 1,
    UNIQUE(user_email, protocol_id, protocol_type)
);

CREATE INDEX idx_recent_protocols_user ON user_recent_protocols(user_email, last_viewed_at DESC);
CREATE INDEX idx_recent_protocols_protocol ON user_recent_protocols(protocol_id, protocol_type);
