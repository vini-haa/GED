-- 000001_initial_schema.up.sql
-- Schema inicial do GED FADEX

CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMIN')),
    ativo BOOLEAN DEFAULT true,
    criado_por VARCHAR(255),
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tipos_documento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) UNIQUE NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocolo_sagi VARCHAR(20) NOT NULL,
    tipo_documento_id UUID REFERENCES tipos_documento(id),
    nome_arquivo VARCHAR(500) NOT NULL,
    drive_file_id VARCHAR(100),
    drive_file_url TEXT,
    tamanho_bytes BIGINT,
    mime_type VARCHAR(100),
    hash_sha256 VARCHAR(64),
    uploaded_by VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    deleted_by VARCHAR(255),
    motivo_exclusao TEXT
);

CREATE TABLE observacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocolo_sagi VARCHAR(20) NOT NULL,
    texto TEXT NOT NULL,
    autor_email VARCHAR(255) NOT NULL,
    autor_nome VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP DEFAULT NOW(),
    editado_em TIMESTAMP,
    deleted_at TIMESTAMP,
    deleted_by VARCHAR(255),
    motivo_exclusao TEXT
);

CREATE TABLE protocolos_internos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero VARCHAR(20) UNIQUE NOT NULL,
    assunto VARCHAR(500) NOT NULL,
    descricao TEXT,
    status VARCHAR(20) DEFAULT 'ABERTO' CHECK (status IN ('ABERTO', 'EM_ANDAMENTO', 'FINALIZADO', 'CANCELADO')),
    setor_origem VARCHAR(100) NOT NULL,
    criado_por_email VARCHAR(255) NOT NULL,
    criado_por_nome VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tramitacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocolo_interno_id UUID REFERENCES protocolos_internos(id),
    de_setor VARCHAR(100) NOT NULL,
    para_setor VARCHAR(100) NOT NULL,
    despacho TEXT,
    tramitado_por_email VARCHAR(255) NOT NULL,
    tramitado_por_nome VARCHAR(255) NOT NULL,
    tramitado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    acao VARCHAR(50) NOT NULL,
    entidade VARCHAR(50) NOT NULL,
    entidade_id VARCHAR(100),
    detalhes JSONB,
    usuario_email VARCHAR(255) NOT NULL,
    usuario_nome VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cache_email_setor (
    email VARCHAR(255) PRIMARY KEY,
    setor VARCHAR(100) NOT NULL,
    nome VARCHAR(255),
    atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_documentos_protocolo ON documentos(protocolo_sagi);
CREATE INDEX idx_documentos_deleted ON documentos(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_observacoes_protocolo ON observacoes(protocolo_sagi);
CREATE INDEX idx_protocolos_internos_status ON protocolos_internos(status);
CREATE INDEX idx_protocolos_internos_numero ON protocolos_internos(numero);
CREATE INDEX idx_tramitacoes_protocolo ON tramitacoes(protocolo_interno_id);
CREATE INDEX idx_activity_logs_entidade ON activity_logs(entidade, entidade_id);
CREATE INDEX idx_activity_logs_usuario ON activity_logs(usuario_email);
CREATE INDEX idx_activity_logs_criado ON activity_logs(criado_em);
