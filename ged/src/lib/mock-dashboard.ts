import { subDays, format } from 'date-fns';
import type {
  DashboardKpi,
  UploadsPeriodoItem,
  DocsPorTipoItem,
  TramitacaoSetorItem,
  RankingUploadItem,
  ProtocoloSemDocs,
  DashboardData,
} from './types';

// ============================================
// KPIs
// ============================================

export const mockKpis: DashboardKpi[] = [
  {
    label: 'Total de Documentos',
    valor: 1247,
    variacao: 12.5,
    formato: 'numero',
  },
  {
    label: 'Uploads no Período',
    valor: 89,
    variacao: -3.2,
    formato: 'numero',
  },
  {
    label: 'Protocolos sem Docs',
    valor: 34,
    variacao: -8.1,
    formato: 'numero',
  },
  {
    label: 'Tempo Médio Tramitação',
    valor: 4.2,
    variacao: 15.0,
    formato: 'dias',
  },
];

// ============================================
// Uploads por período (últimos 30 dias)
// ============================================

function generateUploadsPeriodo(): UploadsPeriodoItem[] {
  const items: UploadsPeriodoItem[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    items.push({
      data: format(date, 'dd/MM'),
      uploads: isWeekend
        ? Math.floor(Math.random() * 2)
        : Math.floor(Math.random() * 8) + 1,
      protocolos: isWeekend
        ? Math.floor(Math.random() * 3)
        : Math.floor(Math.random() * 12) + 3,
    });
  }
  return items;
}

export const mockUploadsPeriodo: UploadsPeriodoItem[] = generateUploadsPeriodo();

// ============================================
// Documentos por tipo
// ============================================

export const mockDocsPorTipo: DocsPorTipoItem[] = [
  { tipo: 'Ofício', quantidade: 312, cor: '#2563eb' },
  { tipo: 'Requerimento', quantidade: 245, cor: '#7c3aed' },
  { tipo: 'Memorando', quantidade: 198, cor: '#059669' },
  { tipo: 'Relatório', quantidade: 167, cor: '#d97706' },
  { tipo: 'Contrato', quantidade: 134, cor: '#dc2626' },
  { tipo: 'Nota Fiscal', quantidade: 98, cor: '#0891b2' },
  { tipo: 'Outros', quantidade: 93, cor: '#6b7280' },
];

// ============================================
// Tramitação por setor (tempo médio em dias)
// ============================================

export const mockTramitacaoPorSetor: TramitacaoSetorItem[] = [
  { setor: 'Jurídico', tempoMedioDias: 8.3, acimaDaMedia: true },
  { setor: 'Contabilidade', tempoMedioDias: 6.1, acimaDaMedia: true },
  { setor: 'Diretoria Executiva', tempoMedioDias: 5.4, acimaDaMedia: true },
  { setor: 'Ger. Financeira', tempoMedioDias: 4.2, acimaDaMedia: false },
  { setor: 'Compras e Licitações', tempoMedioDias: 3.8, acimaDaMedia: false },
  { setor: 'Ger. Projetos', tempoMedioDias: 3.1, acimaDaMedia: false },
  { setor: 'Ger. Administrativa', tempoMedioDias: 2.5, acimaDaMedia: false },
  { setor: 'Ger. TI', tempoMedioDias: 1.8, acimaDaMedia: false },
  { setor: 'Superintendência', tempoMedioDias: 1.4, acimaDaMedia: false },
  { setor: 'RH', tempoMedioDias: 1.2, acimaDaMedia: false },
];

// ============================================
// Ranking de uploads
// ============================================

export const mockRankingUploads: RankingUploadItem[] = [
  { posicao: 1, nome: 'Ana Silva', setor: 'Ger. Projetos', uploads: 47 },
  { posicao: 2, nome: 'Carlos Mendes', setor: 'Ger. Administrativa', uploads: 38 },
  { posicao: 3, nome: 'Mariana Costa', setor: 'Ger. Financeira', uploads: 31 },
  { posicao: 4, nome: 'Patrícia Lima', setor: 'Compras e Licitações', uploads: 28 },
  { posicao: 5, nome: 'Vinicius Silva', setor: 'Ger. TI', uploads: 24 },
  { posicao: 6, nome: 'Roberto Alves', setor: 'Jurídico', uploads: 19 },
  { posicao: 7, nome: 'Fernanda Souza', setor: 'RH', uploads: 16 },
  { posicao: 8, nome: 'Rafael Barbosa', setor: 'Contabilidade', uploads: 14 },
  { posicao: 9, nome: 'Marcos Vieira', setor: 'Patrimônio', uploads: 11 },
  { posicao: 10, nome: 'José Santos', setor: 'Almoxarifado', uploads: 7 },
];

// ============================================
// Protocolos sem documentos
// ============================================

export const mockProtocolosSemDocs: ProtocoloSemDocs[] = [
  { id: 'psd_1', numero: '01489/2026', assunto: 'Prestação de contas parcial — UFPI/2025', setorDestino: 'Ger. Financeira', diasSemDocumento: 45 },
  { id: 'psd_2', numero: '01512/2026', assunto: 'Solicitação de bolsa pesquisa — PROPESQI', setorDestino: 'Ger. Projetos', diasSemDocumento: 32 },
  { id: 'psd_3', numero: '01534/2026', assunto: 'Contrato serviço manutenção predial', setorDestino: 'Ger. Administrativa', diasSemDocumento: 28 },
  { id: 'psd_4', numero: '01567/2026', assunto: 'Aditivo prazo projeto IFPI/2026', setorDestino: 'Jurídico', diasSemDocumento: 21 },
  { id: 'psd_5', numero: '01589/2026', assunto: 'Requisição compra material consumo', setorDestino: 'Compras e Licitações', diasSemDocumento: 18 },
  { id: 'psd_6', numero: '01601/2026', assunto: 'Relatório auditoria interna Q4/2025', setorDestino: 'Contabilidade', diasSemDocumento: 15 },
  { id: 'psd_7', numero: '01623/2026', assunto: 'Parecer jurídico — credenciamento UESPI', setorDestino: 'Jurídico', diasSemDocumento: 12 },
  { id: 'psd_8', numero: '01645/2026', assunto: 'Nota fiscal serviço gráfico', setorDestino: 'Ger. Financeira', diasSemDocumento: 9 },
  { id: 'psd_9', numero: '01667/2026', assunto: 'Termo devolução equipamento', setorDestino: 'Patrimônio', diasSemDocumento: 5 },
  { id: 'psd_10', numero: '01678/2026', assunto: 'Comunicado alteração horário', setorDestino: 'RH', diasSemDocumento: 2 },
];

// ============================================
// Dados consolidados
// ============================================

export const mockDashboardData: DashboardData = {
  kpis: mockKpis,
  uploadsPeriodo: mockUploadsPeriodo,
  docsPorTipo: mockDocsPorTipo,
  tramitacaoPorSetor: mockTramitacaoPorSetor,
  rankingUploads: mockRankingUploads,
  protocolosSemDocs: mockProtocolosSemDocs,
};
