// ============================================
// GED FADEX — API Contract v1.0
// Backend: Go (Gin) :4017
// Frontend: Next.js :4016
// Gerado em: 2026-02-26
// ============================================
//
// Este arquivo é a fonte da verdade para tipos de request/response
// entre backend e frontend. Qualquer alteração deve ser discutida
// entre os dois times antes de ser implementada.
//
// Convenções:
// - Campos em snake_case (padrão do backend Go JSON tags)
// - Datas como string ISO 8601 (ex: "2026-02-26T14:30:00Z")
// - UUIDs como string (ex: "550e8400-e29b-41d4-a716-446655440000")
// - Campos opcionais marcados com ? (podem ser null ou ausentes)

// ============================================
// ENUMS
// ============================================

export type Role = "SUPER_ADMIN" | "ADMIN" | "USER_SETOR" | "VIEWER";

export type StatusProtocoloInterno =
  | "ABERTO"
  | "EM_ANDAMENTO"
  | "FINALIZADO"
  | "CANCELADO";

export type AcaoLog =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "UPLOAD"
  | "SOFT_DELETE"
  | "DEACTIVATE"
  | "LOGIN"
  | "TRAMITAR";

export type EntidadeLog =
  | "DOCUMENTO"
  | "OBSERVACAO"
  | "PROTOCOLO_INTERNO"
  | "TRAMITACAO"
  | "ADMIN"
  | "TIPO_DOCUMENTO";

// ============================================
// COMMON TYPES
// ============================================

/** Resposta padrão da API para um item ou ação */
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: ApiError;
}

/** Resposta paginada da API */
export interface ApiPaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: FieldError[];
}

export interface FieldError {
  field: string;
  message: string;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

/** Parâmetros de paginação comuns (query params) */
export interface PaginationParams {
  page?: number; // default: 1
  per_page?: number; // default: 20, max: 100
}

// ============================================
// 1. AUTH
// ============================================

/**
 * GET /api/me
 * Roles: qualquer usuário autenticado
 * Header: Authorization: Bearer <token>
 *
 * Retorna dados do usuário autenticado, extraídos do JWT + lookup no banco.
 *
 * Exemplo:
 *   const res = await fetch("/api/me", {
 *     headers: { Authorization: `Bearer ${token}` }
 *   });
 */
export interface UserMe {
  email: string;
  nome: string;
  role: Role;
  setor?: string; // presente apenas se role === "USER_SETOR"
}

// Response: ApiResponse<UserMe>

/**
 * GET /api/health
 * Roles: público (sem autenticação)
 *
 * Verifica saúde do sistema e conexões com bancos.
 */
export interface HealthResponse {
  status: "running";
  timestamp: string;
  databases: {
    postgres: string; // "ok" | "error: ..."
    sagi: string; // "ok" | "error: ..." | "not_configured"
  };
}

// ============================================
// 2. PROTOCOLOS SAGI (somente leitura)
// ============================================

/** Protocolo retornado do sistema SAGI (SQL Server) */
export interface ProtocoloSAGI {
  numero_protocolo: number;
  ano_protocolo: number;
  data_protocolo: string;
  codigo_origem: number;
  setor_origem: string | null;
  codigo_destino: number;
  setor_destino: string | null;
  assunto: string | null;
  situacao: string | null;
  projeto_descricao: string | null;
  numero_convenio: string | null;
  convenio_objeto: string | null;
  convenio_valor_global: number | null;
  convenio_inicio_vigencia: string | null;
  convenio_fim_vigencia: string | null;
  usuario_nome: string | null;
  usuario_email: string | null;
}

/**
 * GET /api/protocolos
 * Roles: SUPER_ADMIN, ADMIN, USER_SETOR, VIEWER
 * USER_SETOR vê apenas protocolos do seu setor
 *
 * Exemplo:
 *   const res = await fetch("/api/protocolos?page=1&per_page=20&busca=oficio");
 */
export interface ProtocoloListFilters extends PaginationParams {
  situacao?: string;
  setor?: number; // codigo do setor (origem ou destino)
  busca?: string; // busca no assunto ou número
}

// Response: ApiPaginatedResponse<ProtocoloSAGI>

/**
 * GET /api/protocolos/:numero/:ano
 * Roles: SUPER_ADMIN, ADMIN, USER_SETOR, VIEWER
 *
 * Retorna protocolo específico com documentos e observações vinculados.
 *
 * Exemplo:
 *   const res = await fetch("/api/protocolos/123/2026");
 */
export interface ProtocoloDetalhes {
  protocolo: ProtocoloSAGI;
  documentos: Documento[];
  observacoes: Observacao[];
  total_documentos: number;
  total_observacoes: number;
}

// Response: ApiResponse<ProtocoloDetalhes>

/** Setor retornado do SAGI */
export interface SetorSAGI {
  codigo: number;
  nome: string;
}

/**
 * GET /api/setores
 * Roles: SUPER_ADMIN, ADMIN, USER_SETOR
 *
 * Lista todos os setores ativos do SAGI.
 */
// Response: ApiResponse<SetorSAGI[]>

/**
 * GET /api/setores/me
 * Roles: qualquer autenticado
 *
 * Retorna setores vinculados ao email do usuário logado.
 */
// Response: ApiResponse<SetorSAGI[]>

// ============================================
// 3. DOCUMENTOS
// ============================================

/** Documento vinculado a um protocolo SAGI */
export interface Documento {
  id: string; // UUID
  protocolo_sagi: string;
  tipo_documento_id: string | null; // UUID
  tipo_documento_nome?: string; // join com tipos_documento
  nome_arquivo: string;
  drive_file_id: string | null;
  drive_file_url: string | null;
  tamanho_bytes: number | null;
  mime_type: string | null;
  hash_sha256: string | null;
  uploaded_by: string;
  uploaded_at: string;
}

/**
 * GET /api/protocolos/:numero/:ano/documentos
 * Roles: SUPER_ADMIN, ADMIN, USER_SETOR, VIEWER
 *
 * Lista documentos de um protocolo.
 *
 * Exemplo:
 *   const res = await fetch("/api/protocolos/123/2026/documentos");
 */
// Response: ApiResponse<Documento[]>

/**
 * GET /api/documentos/:id
 * Roles: SUPER_ADMIN, ADMIN, USER_SETOR, VIEWER
 */
// Response: ApiResponse<Documento>

/**
 * POST /api/protocolos/:numero/:ano/documentos
 * Roles: SUPER_ADMIN, ADMIN, USER_SETOR
 * Content-Type: multipart/form-data
 *
 * Upload de documento para o Google Drive e vinculação ao protocolo.
 *
 * Exemplo:
 *   const form = new FormData();
 *   form.append("arquivo", file);
 *   form.append("tipo_documento_id", "uuid-aqui");
 *   const res = await fetch("/api/protocolos/123/2026/documentos", {
 *     method: "POST",
 *     headers: { Authorization: `Bearer ${token}` },
 *     body: form,
 *   });
 */
export interface UploadDocRequest {
  arquivo: File; // multipart
  tipo_documento_id?: string; // UUID
}

// Response: ApiResponse<Documento>

/**
 * DELETE /api/documentos/:id
 * Roles: SUPER_ADMIN, ADMIN
 * Soft delete — requer motivo.
 *
 * Exemplo:
 *   const res = await fetch("/api/documentos/uuid", {
 *     method: "DELETE",
 *     headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
 *     body: JSON.stringify({ motivo_exclusao: "Arquivo duplicado" }),
 *   });
 */
export interface SoftDeleteDocumentoRequest {
  motivo_exclusao: string;
}

// Response: ApiResponse<null> (204 ou { message: "Documento removido" })

/**
 * GET /api/documentos/:id/download
 * Roles: SUPER_ADMIN, ADMIN, USER_SETOR, VIEWER
 *
 * Redireciona para URL de download do Google Drive ou retorna stream.
 */
// Response: redirect 302 | binary stream

// ============================================
// 4. OBSERVAÇÕES
// ============================================

/** Observação/comentário em um protocolo SAGI */
export interface Observacao {
  id: string; // UUID
  protocolo_sagi: string;
  texto: string;
  autor_email: string;
  autor_nome: string;
  criado_em: string;
  editado_em: string | null;
}

/**
 * GET /api/protocolos/:numero/:ano/observacoes
 * Roles: SUPER_ADMIN, ADMIN, USER_SETOR, VIEWER
 */
// Response: ApiResponse<Observacao[]>

/**
 * POST /api/protocolos/:numero/:ano/observacoes
 * Roles: SUPER_ADMIN, ADMIN, USER_SETOR
 *
 * Exemplo:
 *   const res = await fetch("/api/protocolos/123/2026/observacoes", {
 *     method: "POST",
 *     headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
 *     body: JSON.stringify({ texto: "Documento recebido via email." }),
 *   });
 */
export interface CreateObservacaoRequest {
  texto: string;
}

// Response: ApiResponse<Observacao>

/**
 * PATCH /api/observacoes/:id
 * Roles: SUPER_ADMIN, ADMIN, ou o próprio autor
 */
export interface UpdateObservacaoRequest {
  texto: string;
}

// Response: ApiResponse<null> (200 { message: "Observação atualizada" })

/**
 * DELETE /api/observacoes/:id
 * Roles: SUPER_ADMIN, ADMIN
 * Soft delete — requer motivo.
 */
export interface SoftDeleteObservacaoRequest {
  motivo_exclusao: string;
}

// Response: ApiResponse<null>

// ============================================
// 5. PROTOCOLOS INTERNOS
// ============================================

/** Protocolo criado internamente no GED (não vem do SAGI) */
export interface ProtocoloInterno {
  id: string; // UUID
  numero: string; // formato: GED-2026-001
  assunto: string;
  descricao: string | null;
  status: StatusProtocoloInterno;
  setor_origem: string;
  criado_por_email: string;
  criado_por_nome: string;
  criado_em: string;
  atualizado_em: string;
}

/**
 * GET /api/protocolos-internos
 * Roles: SUPER_ADMIN, ADMIN, USER_SETOR
 * USER_SETOR vê apenas protocolos do seu setor
 *
 * Exemplo:
 *   const res = await fetch("/api/protocolos-internos?status=ABERTO&page=1");
 */
export interface ProtocoloInternoListFilters extends PaginationParams {
  status?: StatusProtocoloInterno;
  setor_origem?: string;
  busca?: string; // busca no assunto (ILIKE)
}

// Response: ApiPaginatedResponse<ProtocoloInterno>

/**
 * GET /api/protocolos-internos/:id
 * Roles: SUPER_ADMIN, ADMIN, USER_SETOR
 */
export interface ProtocoloInternoDetalhes {
  protocolo: ProtocoloInterno;
  tramitacoes: Tramitacao[];
}

// Response: ApiResponse<ProtocoloInternoDetalhes>

/**
 * GET /api/protocolos-internos/numero/:numero
 * Roles: SUPER_ADMIN, ADMIN, USER_SETOR
 *
 * Busca por número legível (ex: GED-2026-001).
 */
// Response: ApiResponse<ProtocoloInternoDetalhes>

/**
 * POST /api/protocolos-internos
 * Roles: SUPER_ADMIN, ADMIN, USER_SETOR
 *
 * O número (GED-YYYY-NNN) é gerado automaticamente pelo backend.
 *
 * Exemplo:
 *   const res = await fetch("/api/protocolos-internos", {
 *     method: "POST",
 *     headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
 *     body: JSON.stringify({
 *       assunto: "Solicitação de compra",
 *       descricao: "Necessidade de material de escritório",
 *       setor_origem: "Gerência de Projetos",
 *     }),
 *   });
 */
export interface CreateProtocoloInternoRequest {
  assunto: string;
  descricao?: string;
  setor_origem: string;
}

// Response: ApiResponse<ProtocoloInterno>

/**
 * PATCH /api/protocolos-internos/:id/status
 * Roles: SUPER_ADMIN, ADMIN
 */
export interface UpdateStatusProtocoloInternoRequest {
  status: StatusProtocoloInterno;
}

// Response: ApiResponse<null>

// ============================================
// 6. TRAMITAÇÕES
// ============================================

/** Movimentação de protocolo interno entre setores */
export interface Tramitacao {
  id: string; // UUID
  protocolo_interno_id: string; // UUID
  de_setor: string;
  para_setor: string;
  despacho: string | null;
  tramitado_por_email: string;
  tramitado_por_nome: string;
  tramitado_em: string;
}

/**
 * GET /api/protocolos-internos/:id/tramitacoes
 * Roles: SUPER_ADMIN, ADMIN, USER_SETOR
 */
// Response: ApiResponse<Tramitacao[]>

/**
 * POST /api/protocolos-internos/:id/tramitacoes
 * Roles: SUPER_ADMIN, ADMIN, USER_SETOR
 *
 * Tramita o protocolo para outro setor. Atualiza status para EM_ANDAMENTO
 * automaticamente se estiver ABERTO.
 *
 * Exemplo:
 *   const res = await fetch("/api/protocolos-internos/uuid/tramitacoes", {
 *     method: "POST",
 *     headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
 *     body: JSON.stringify({
 *       para_setor: "Gerência Financeira",
 *       despacho: "Encaminho para análise de saldo",
 *     }),
 *   });
 */
export interface CreateTramitacaoRequest {
  para_setor: string;
  despacho?: string;
}

// Response: ApiResponse<Tramitacao>

// ============================================
// 7. TIPOS DE DOCUMENTO
// ============================================

/** Categoria de documento (Ofício, Relatório, etc.) */
export interface TipoDocumento {
  id: string; // UUID
  nome: string;
  descricao: string | null;
  ativo: boolean;
  criado_em: string;
}

/**
 * GET /api/tipos-documento
 * Roles: qualquer autenticado
 *
 * Lista tipos ativos (para popular selects/dropdowns).
 */
// Response: ApiResponse<TipoDocumento[]>

/**
 * GET /api/tipos-documento/:id
 * Roles: SUPER_ADMIN, ADMIN
 */
// Response: ApiResponse<TipoDocumento>

/**
 * POST /api/tipos-documento
 * Roles: SUPER_ADMIN, ADMIN
 */
export interface CreateTipoDocumentoRequest {
  nome: string;
  descricao?: string;
}

// Response: ApiResponse<TipoDocumento>

/**
 * PUT /api/tipos-documento/:id
 * Roles: SUPER_ADMIN, ADMIN
 */
export interface UpdateTipoDocumentoRequest {
  nome: string;
  descricao?: string;
}

// Response: ApiResponse<null>

/**
 * DELETE /api/tipos-documento/:id
 * Roles: SUPER_ADMIN
 * Desativa o tipo (soft deactivate, não remove).
 */
// Response: ApiResponse<null>

// ============================================
// 8. DASHBOARD
// ============================================

/**
 * GET /api/dashboard/kpis
 * Roles: SUPER_ADMIN, ADMIN
 *
 * Retorna indicadores gerais do sistema.
 */
export interface DashboardKPIs {
  total_protocolos_sagi: number;
  total_protocolos_internos: number;
  protocolos_internos_abertos: number;
  protocolos_internos_em_andamento: number;
  total_documentos: number;
  total_admins: number;
  documentos_ultimos_30_dias: number;
}

// Response: ApiResponse<DashboardKPIs>

/**
 * GET /api/dashboard/protocolos-por-mes
 * Roles: SUPER_ADMIN, ADMIN
 * Query: ?meses=12 (default 12)
 *
 * Dados para gráfico de barras/linha — protocolos internos criados por mês.
 */
export interface GraficoProtocolosPorMes {
  meses: {
    mes: string; // formato: "2026-01"
    total: number;
  }[];
}

// Response: ApiResponse<GraficoProtocolosPorMes>

/**
 * GET /api/dashboard/ranking-setores
 * Roles: SUPER_ADMIN, ADMIN
 * Query: ?top=10 (default 10)
 *
 * Ranking de setores por volume de tramitações.
 */
export interface RankingSetores {
  setores: {
    setor: string;
    total_tramitacoes: number;
    total_protocolos_origem: number;
  }[];
}

// Response: ApiResponse<RankingSetores>

/**
 * GET /api/dashboard/documentos-por-tipo
 * Roles: SUPER_ADMIN, ADMIN
 *
 * Distribuição de documentos por tipo (para gráfico pizza/donut).
 */
export interface DocumentosPorTipo {
  tipos: {
    tipo_documento_id: string | null;
    tipo_documento_nome: string;
    total: number;
  }[];
}

// Response: ApiResponse<DocumentosPorTipo>

/**
 * GET /api/dashboard/atividade-recente
 * Roles: SUPER_ADMIN, ADMIN
 * Query: ?limit=20 (default 20)
 *
 * Últimas ações realizadas no sistema.
 */
// Response: ApiResponse<ActivityLog[]>

// ============================================
// 9. ADMIN (gestão de administradores)
// ============================================

/** Administrador do sistema GED */
export interface Admin {
  id: string; // UUID
  email: string;
  nome: string;
  role: "SUPER_ADMIN" | "ADMIN";
  ativo: boolean;
  criado_por: string | null;
  criado_em: string;
  atualizado_em: string;
}

/**
 * GET /api/admins
 * Roles: SUPER_ADMIN
 */
export interface AdminListParams extends PaginationParams {}

// Response: ApiPaginatedResponse<Admin>

/**
 * GET /api/admins/:id
 * Roles: SUPER_ADMIN
 */
// Response: ApiResponse<Admin>

/**
 * POST /api/admins
 * Roles: SUPER_ADMIN
 *
 * Exemplo:
 *   const res = await fetch("/api/admins", {
 *     method: "POST",
 *     headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
 *     body: JSON.stringify({
 *       email: "novo.admin@fadex.org.br",
 *       nome: "Novo Admin",
 *       role: "ADMIN",
 *     }),
 *   });
 */
export interface CreateAdminRequest {
  email: string;
  nome: string;
  role: "SUPER_ADMIN" | "ADMIN";
}

// Response: ApiResponse<Admin>

/**
 * PATCH /api/admins/:id/role
 * Roles: SUPER_ADMIN
 */
export interface UpdateAdminRoleRequest {
  role: "SUPER_ADMIN" | "ADMIN";
}

// Response: ApiResponse<null>

/**
 * DELETE /api/admins/:id
 * Roles: SUPER_ADMIN
 * Desativa o admin (ativo = false), não deleta.
 */
// Response: ApiResponse<null>

/**
 * GET /api/admins/count
 * Roles: SUPER_ADMIN
 */
export interface AdminCountResponse {
  total: number;
}

// Response: ApiResponse<AdminCountResponse>

// ============================================
// 10. ACTIVITY LOGS (auditoria)
// ============================================

/** Registro de auditoria */
export interface ActivityLog {
  id: string; // UUID
  acao: AcaoLog;
  entidade: EntidadeLog;
  entidade_id: string | null;
  detalhes: Record<string, unknown> | null; // JSONB
  usuario_email: string;
  usuario_nome: string;
  ip_address: string | null;
  criado_em: string;
}

/**
 * GET /api/activity-logs
 * Roles: SUPER_ADMIN, ADMIN
 *
 * Exemplo:
 *   const res = await fetch("/api/activity-logs?entidade=DOCUMENTO&page=1&per_page=50");
 */
export interface ActivityLogFilters extends PaginationParams {
  entidade?: EntidadeLog;
  usuario_email?: string;
  desde?: string; // ISO 8601
  ate?: string; // ISO 8601
}

// Response: ApiPaginatedResponse<ActivityLog>

// ============================================
// 11. EXPORTAÇÕES
// ============================================

/**
 * POST /api/protocolos/:numero/:ano/export/zip
 * Roles: SUPER_ADMIN, ADMIN, USER_SETOR
 *
 * Gera um ZIP com todos os documentos do protocolo para download.
 */
export interface ExportZipRequest {
  incluir_observacoes?: boolean; // default: false — se true, inclui observacoes.txt
}

// Response: binary (application/zip) com Content-Disposition: attachment

/**
 * POST /api/protocolos/:numero/:ano/export/dossie
 * Roles: SUPER_ADMIN, ADMIN
 *
 * Gera um dossiê PDF consolidado com capa, índice, documentos e observações.
 */
export interface ExportDossieRequest {
  titulo?: string; // título personalizado na capa
  incluir_observacoes?: boolean; // default: true
  incluir_dados_convenio?: boolean; // default: true
}

// Response: binary (application/pdf) com Content-Disposition: attachment

/**
 * GET /api/protocolos-internos/:id/export/pdf
 * Roles: SUPER_ADMIN, ADMIN
 *
 * Exporta protocolo interno com histórico de tramitações como PDF.
 */
// Response: binary (application/pdf)

/**
 * GET /api/activity-logs/export/csv
 * Roles: SUPER_ADMIN
 * Aceita os mesmos filtros de ActivityLogFilters como query params.
 *
 * Exporta logs de auditoria como CSV.
 */
// Response: binary (text/csv) com Content-Disposition: attachment

// ============================================
// 12. CACHE EMAIL-SETOR (gestão interna)
// ============================================

/** Cache de mapeamento email → setor */
export interface CacheEmailSetor {
  email: string;
  setor: string;
  nome: string | null;
  atualizado_em: string;
}

/**
 * GET /api/cache-email-setor
 * Roles: SUPER_ADMIN
 */
// Response: ApiResponse<CacheEmailSetor[]>

/**
 * PUT /api/cache-email-setor
 * Roles: SUPER_ADMIN
 *
 * Upsert — cria ou atualiza o mapeamento.
 */
export interface UpsertCacheEmailSetorRequest {
  email: string;
  setor: string;
  nome?: string;
}

// Response: ApiResponse<null>
