// ============================================
// Paginação genérica (espelho do Go Pagination)
// ============================================

export interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: Pagination;
}

// ============================================
// Protocolo SAGI — espelho de dto.ProtocoloItem
// ============================================

export type ProtocolTab =
  | 'todos'
  | 'meu_setor'
  | 'recentes'
  | 'sem_docs'
  | 'internos';

export interface Protocol {
  id: number;
  internal_id?: string;
  numero_protocolo: string;
  data_criacao: string | null;
  assunto: string;
  nome_projeto: string;
  codigo_convenio: string;
  nome_interessado: string;
  nome_setor_atual: string;
  cod_setor_atual: number;
  data_chegada_setor: string | null;
  status: string;
  doc_count: number;
  is_new: boolean;
  has_recent_observations: boolean;
  is_internal: boolean;
}

/** Contadores — espelho de dto.ContadoresResponse */
export interface ProtocolCounters {
  total_protocolos: number;
  sem_documentos: number;
  docs_anexados: number;
}

/** Filtros para listagem de protocolos */
export interface ProtocolFilters {
  tab: ProtocolTab;
  busca: string;
  status: string;
  setor: number | 'all';
  periodo: 'all' | '7d' | '30d' | '90d' | '1y';
  page: number;
  pageSize: number;
  ordenacao?: 'data_criacao' | 'data_chegada_setor';
  projeto?: string;
}

/** Setor — espelho de dto.SetorItem */
export interface Setor {
  codigo: number;
  descricao: string;
}

/** Remove o prefixo "- " de nomes de setor SAGI (dados legados). */
export function formatSectorName(name: string | undefined | null): string {
  if (!name) return '—';
  return name.startsWith('- ') ? name.slice(2) : name;
}

// ============================================
// Busca Global — espelho de dto.SearchResponse
// ============================================

export interface SearchResultItem {
  id: number;
  numero_protocolo: string;
  assunto: string;
  nome_projeto: string;
  nome_interessado: string;
  tipo: string;
  highlight: string;
}

export interface SearchResponse {
  results: SearchResultItem[];
  total_setor: number;
  total_todos: number;
}

// ============================================
// Detalhe do Protocolo — espelho de dto.ProtocoloDetalheResponse
// ============================================

export interface ProtocoloDetalhe {
  id: number;
  numero_protocolo: string;
  data_criacao: string | null;
  assunto: string;
  nome_projeto: string;
  codigo_convenio: string;
  nome_interessado: string;
  nome_setor_atual: string;
  cod_setor_atual: number;
  data_chegada_setor: string | null;
  status: string;
  is_internal: boolean;
  doc_count: number;
  observation_count: number;
  has_recent_observations: boolean;
  tramitacao_count: number;
  interessado: string;
  observacao: string;
  usuario_cadastro: string;
  conta_corrente: string;
  dias_ultima_movimentacao: number;
  situacao: string;
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
// Documentos — espelho de dto.DocumentoItem
// ============================================

export interface Documento {
  id: string;
  protocolo_sagi: string;
  tipo_documento_id: string | null;
  tipo_documento_nome: string;
  nome_arquivo: string;
  descricao: string;
  drive_file_url: string;
  tamanho_bytes: number;
  mime_type: string;
  uploaded_by: string;
  uploaded_by_name: string;
  uploaded_at: string | null;
  can_edit: boolean;
  can_delete: boolean;
}

export interface ListDocumentosResponse {
  data: Documento[];
  total: number;
}

// ============================================
// Observações — espelho de dto.ObservacaoItem
// ============================================

export interface Observacao {
  id: string;
  protocol_id: number;
  protocol_source: string;
  content: string;
  is_important: boolean;
  parent_id: string | null;
  reply_count: number;
  created_by_email: string;
  created_by_name: string;
  created_by_sector: string;
  created_at: string | null;
  updated_at: string | null;
  can_edit: boolean;
  can_delete: boolean;
}

export interface ListObservacoesResponse {
  data: Observacao[];
  total: number;
  has_recent: boolean;
}

// ============================================
// Tramitação SAGI — espelho de dto.TramitacaoItem
// ============================================

export interface TramitacaoSagi {
  sequencia: number;
  data_movimentacao: string | null;
  setor_origem: string;
  setor_destino: string;
  situacao: string;
  reg_atual: boolean;
  permanencia_dias: number;
  usuario_envio: string;
  usuario_recebimento: string;
  data_recebimento: string | null;
  observacao: string;
}

export interface TramitacaoResumo {
  tempo_total_dias: number;
  total_setores: number;
  setor_mais_longo: string;
  dias_setor_mais_longo: number;
}

export interface TramitacaoResponse {
  data: TramitacaoSagi[];
  total: number;
  resumo: TramitacaoResumo;
}

// ============================================
// Protocolo Interno — espelho de dto.InternalProtocolItem / Detail
// ============================================

export type StatusProtocoloInterno =
  | 'aberto'
  | 'em_analise'
  | 'finalizado'
  | 'arquivado'
  | 'cancelado';

export interface ProtocoloInterno {
  id: number;
  protocol_number: string;
  subject: string;
  interested: string;
  sender: string;
  project_name: string;
  observations: string;
  current_sector_name: string;
  current_sector_code: number;
  status: StatusProtocoloInterno;
  created_by_name: string;
  created_by_email: string;
  created_at: string | null;
  doc_count: number;
  obs_count: number;
}

export interface ProtocoloInternoDetalhe {
  id: number;
  protocol_number: string;
  subject: string;
  interested: string;
  sender: string;
  project_name: string;
  observations: string;
  current_sector_name: string;
  current_sector_code: number;
  status: StatusProtocoloInterno;
  cancel_reason?: string;
  created_by_name: string;
  created_by_email: string;
  created_at: string | null;
  updated_at: string | null;
  doc_count: number;
  obs_count: number;
  tramitacao_count: number;
}

/** Request para criar protocolo interno — espelho de dto.CreateInternalProtocolRequest */
export interface CreateProtocoloInternoRequest {
  subject: string;
  project_name: string;
  observations: string;
  sector_code?: number;
}

/** Request para editar protocolo interno — espelho de dto.UpdateInternalProtocolRequest */
export interface UpdateProtocoloInternoRequest {
  subject?: string;
  project_name?: string;
  observations?: string;
}

/** Request para alterar status */
export interface ChangeStatusRequest {
  status: string;
  cancel_reason?: string;
}

/** Request para tramitar */
export interface DispatchRequest {
  to_sector_code: number;
  dispatch_note: string;
}

// ============================================
// Tramitação Interna — espelho de dto.MovementItem
// ============================================

export interface TramitacaoInterna {
  id: number;
  sequence: number;
  from_sector_name: string;
  to_sector_name: string;
  dispatch_note: string;
  moved_by_name: string;
  moved_by_email: string;
  moved_at: string | null;
  is_current: boolean;
  permanencia_dias: number;
}

export interface MovementResumo {
  tempo_total_dias: number;
  total_setores: number;
  setor_mais_longo: string;
  dias_setor_mais_longo: number;
}

export interface MovementHistoryResponse {
  data: TramitacaoInterna[];
  total: number;
  resumo: MovementResumo;
}

export interface ListInternalProtocolsResponse {
  data: ProtocoloInterno[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ============================================
// Dashboard (Semana 7-8) — endpoints: GET /api/dashboard/*
// ============================================

export interface DashboardFilters {
  periodo: '7d' | '30d' | '90d' | '1y';
  setor: string | 'all';
  projeto: string | 'all';
}

export interface DashboardKpi {
  label: string;
  valor: number;
  variacao: number;
  formato: 'numero' | 'dias';
}

export interface UploadsPeriodoItem {
  data: string;
  uploads: number;
  protocolos_externos: number;
  protocolos_internos: number;
}

export interface DocsPorTipoItem {
  tipo: string;
  quantidade: number;
  cor: string;
}

export interface TramitacaoSetorItem {
  setor: string;
  tempoMedioDias: number;
  acimaDaMedia: boolean;
}

export interface RankingUploadItem {
  posicao: number;
  nome: string;
  setor: string;
  uploads: number;
}

export interface ProtocoloSemDocs {
  id: string;
  numero: string;
  assunto: string | null;
  setorDestino: string | null;
  diasSemDocumento: number;
}

export interface DashboardData {
  kpis: DashboardKpi[];
  uploadsPeriodo: UploadsPeriodoItem[];
  docsPorTipo: DocsPorTipoItem[];
  tramitacaoPorSetor: TramitacaoSetorItem[];
  rankingUploads: RankingUploadItem[];
  protocolosSemDocs: ProtocoloSemDocs[];
}

// ============================================
// Administradores (Semana 9) — endpoints: /api/admin/admins
// ============================================

export interface AdminUser {
  id: string;
  nome: string;
  email: string;
  setor: string;
  gedRole: 'super_admin' | 'admin';
  ativo: boolean;
  adicionadoEm: string;
  adicionadoPor: string;
}

// ============================================
// Logs de Atividade (Semana 9) — endpoint: GET /api/admin/logs
// ============================================

export type LogAction =
  | 'LOGIN'
  | 'UPLOAD'
  | 'DOWNLOAD'
  | 'DELETE'
  | 'EDIT'
  | 'CREATE'
  | 'TRAMITAR'
  | 'EXPORT'
  | 'ADMIN_CHANGE';

export interface ActivityLog {
  id: string;
  acao: LogAction;
  descricao: string;
  usuarioNome: string;
  usuarioEmail: string;
  setor: string;
  recurso: string | null;
  recursoId: string | null;
  detalhes: Record<string, string> | null;
  ip: string | null;
  criadoEm: string;
}

// ============================================
// Upload de documentos (Semana 6)
// ============================================

export type UploadFileStatus = 'queued' | 'uploading' | 'done' | 'error';

export interface UploadFileItem {
  id: string;
  file: File;
  tipoDocumentoId: string | null;
  status: UploadFileStatus;
  progress: number;
  error: string | null;
}

// ============================================
// Usuário atual — espelho de GET /api/me
// ============================================

export interface CurrentUser {
  email: string;
  nome: string;
  role: string;
  setor?: string;
}
