// ============================================
// Status e tipos de protocolo
// ============================================

export type ProtocolStatus =
  | 'Em Andamento'
  | 'Concluído'
  | 'Pendente'
  | 'Cancelado';

export type ProtocolTab =
  | 'my-sector'
  | 'recents'
  | 'no-docs'
  | 'internals'
  | 'all';

/** Protocolo SAGI (leitura do SQL Server) — campos em camelCase no frontend */
export interface Protocol {
  id: string;
  numeroProtocolo: number;
  anoProtocolo: number;
  dataProtocolo: string;
  codigoOrigem: number;
  setorOrigem: string | null;
  codigoDestino: number;
  setorDestino: string | null;
  assunto: string | null;
  situacao: ProtocolStatus;
  projetoDescricao: string | null;
  numeroConvenio: string | null;
  documentCount: number;
  lastUpdated: string;
}

/** Contadores para os cards KPI */
export interface ProtocolCounters {
  totalSetor: number;
  semDocumentos: number;
  totalDocumentos: number;
}

/** Filtros aplicados na listagem de protocolos */
export interface ProtocolFilters {
  tab: ProtocolTab;
  busca: string;
  status: ProtocolStatus | 'all';
  setor: number | 'all';
  periodo: 'all' | '7d' | '30d' | '90d' | '1y';
  page: number;
  perPage: number;
}

/** Setor do SAGI */
export interface Setor {
  codigo: number;
  nome: string;
}

/** Resposta paginada (espelho do contrato da API) */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// ============================================
// Tipos de documento (Semana 2)
// ============================================

export interface DocumentType {
  id: string;
  name: string;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Documentos (Semana 4)
// ============================================

/** Documento vinculado a um protocolo SAGI */
export interface Documento {
  id: string;
  protocoloSagi: string;
  tipoDocumentoId: string | null;
  tipoDocumentoNome: string | null;
  nomeArquivo: string;
  driveFileId: string | null;
  driveFileUrl: string | null;
  tamanhoBytes: number | null;
  mimeType: string | null;
  uploadedBy: string;
  uploadedAt: string;
}

// ============================================
// Observações (Semana 5)
// ============================================

/** Observação/comentário em um protocolo SAGI */
export interface Observacao {
  id: string;
  protocoloSagi: string;
  texto: string;
  autorEmail: string;
  autorNome: string;
  autorSetor: string;
  importante: boolean;
  criadoEm: string;
  editadoEm: string | null;
}

// ============================================
// Tramitação SAGI (Semana 5)
// ============================================

/** Movimentação de protocolo entre setores */
export interface TramitacaoSagi {
  id: string;
  protocoloSagi: string;
  deSetor: string;
  paraSetor: string;
  despacho: string | null;
  tramitadoPorNome: string;
  tramitadoEm: string;
}

// ============================================
// Protocolo Interno GED (Semana 6)
// ============================================

export type StatusProtocoloInterno =
  | 'ABERTO'
  | 'EM_ANDAMENTO'
  | 'FINALIZADO'
  | 'CANCELADO';

/** Protocolo interno criado pelo GED (não SAGI) */
export interface ProtocoloInterno {
  id: string;
  numero: string;
  assunto: string;
  descricao: string | null;
  status: StatusProtocoloInterno;
  setorOrigem: string;
  criadoPorEmail: string;
  criadoPorNome: string;
  criadoEm: string;
  atualizadoEm: string;
}

/** Tramitação de protocolo interno */
export interface TramitacaoInterna {
  id: string;
  protocoloInternoId: string;
  deSetor: string;
  paraSetor: string;
  despacho: string | null;
  tramitadoPorEmail: string;
  tramitadoPorNome: string;
  tramitadoEm: string;
}

/** Detalhes completos de protocolo interno */
export interface ProtocoloInternoDetalhes {
  protocolo: ProtocoloInterno;
  tramitacoes: TramitacaoInterna[];
}

/** Request para criar protocolo interno */
export interface CreateProtocoloInternoRequest {
  assunto: string;
  descricao?: string;
  setorOrigem: string;
}

// ============================================
// Upload de documentos (Semana 6)
// ============================================

export type UploadFileStatus = 'queued' | 'uploading' | 'done' | 'error';

/** Arquivo na fila de upload */
export interface UploadFileItem {
  id: string;
  file: File;
  tipoDocumentoId: string | null;
  status: UploadFileStatus;
  progress: number;
  error: string | null;
}
