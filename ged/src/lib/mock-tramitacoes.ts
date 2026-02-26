import { subDays, subHours } from 'date-fns';
import type { TramitacaoSagi } from './types';

export const mockTramitacoes: TramitacaoSagi[] = [
  // Protocolo 1523/2026 — 4 movimentações
  {
    id: 'tram_1',
    protocoloSagi: '1523/2026',
    deSetor: 'Gerência de Projetos',
    paraSetor: 'Jurídico',
    despacho: 'Encaminho para análise jurídica do empenho solicitado.',
    tramitadoPorNome: 'Reinaldo Santos',
    tramitadoEm: subDays(new Date(), 5).toISOString(),
  },
  {
    id: 'tram_2',
    protocoloSagi: '1523/2026',
    deSetor: 'Jurídico',
    paraSetor: 'Gerência de Projetos',
    despacho: 'Parecer favorável. Nada a opor quanto ao empenho.',
    tramitadoPorNome: 'Jéssica Lima',
    tramitadoEm: subDays(new Date(), 3).toISOString(),
  },
  {
    id: 'tram_3',
    protocoloSagi: '1523/2026',
    deSetor: 'Gerência de Projetos',
    paraSetor: 'Gerência Financeira',
    despacho: 'Solicitar empenho conforme rubrica 33.90.39.',
    tramitadoPorNome: 'Luanna Oliveira',
    tramitadoEm: subDays(new Date(), 2).toISOString(),
  },
  {
    id: 'tram_4',
    protocoloSagi: '1523/2026',
    deSetor: 'Gerência Financeira',
    paraSetor: 'Gerência de TI',
    despacho: 'Nota de empenho emitida (2026NE000345). Encaminho para ciência do setor solicitante.',
    tramitadoPorNome: 'Milena Costa',
    tramitadoEm: subHours(new Date(), 4).toISOString(),
  },

  // Protocolo 1521/2026 — 3 movimentações
  {
    id: 'tram_5',
    protocoloSagi: '1521/2026',
    deSetor: 'Gerência de Projetos',
    paraSetor: 'Recursos Humanos',
    despacho: 'Solicitar abertura de processo de contratação de bolsista.',
    tramitadoPorNome: 'Bruna Ferreira',
    tramitadoEm: subDays(new Date(), 4).toISOString(),
  },
  {
    id: 'tram_6',
    protocoloSagi: '1521/2026',
    deSetor: 'Recursos Humanos',
    paraSetor: 'Gerência de Projetos',
    despacho: 'Vaga confirmada. Candidato deve apresentar documentação.',
    tramitadoPorNome: 'Pricyla Andrade',
    tramitadoEm: subDays(new Date(), 2).toISOString(),
  },
  {
    id: 'tram_7',
    protocoloSagi: '1521/2026',
    deSetor: 'Gerência de Projetos',
    paraSetor: 'Recursos Humanos',
    despacho: 'Documentação do candidato completa. Prosseguir com assinatura do termo.',
    tramitadoPorNome: 'Matusalá Rodrigues',
    tramitadoEm: subHours(new Date(), 8).toISOString(),
  },

  // Protocolo 1520/2026 — 5 movimentações (muitas, para testar timeline longa)
  {
    id: 'tram_8',
    protocoloSagi: '1520/2026',
    deSetor: 'Gerência de Projetos',
    paraSetor: 'Gerência Financeira',
    despacho: 'Iniciar prestação de contas do 1º trimestre conforme cronograma.',
    tramitadoPorNome: 'Nívea Sousa',
    tramitadoEm: subDays(new Date(), 10).toISOString(),
  },
  {
    id: 'tram_9',
    protocoloSagi: '1520/2026',
    deSetor: 'Gerência Financeira',
    paraSetor: 'Contabilidade',
    despacho: 'Encaminho para conferência dos lançamentos contábeis do período.',
    tramitadoPorNome: 'Milena Costa',
    tramitadoEm: subDays(new Date(), 8).toISOString(),
  },
  {
    id: 'tram_10',
    protocoloSagi: '1520/2026',
    deSetor: 'Contabilidade',
    paraSetor: 'Gerência Financeira',
    despacho: 'Lançamentos conferidos. Sem divergências.',
    tramitadoPorNome: 'Claudiane Mendes',
    tramitadoEm: subDays(new Date(), 6).toISOString(),
  },
  {
    id: 'tram_11',
    protocoloSagi: '1520/2026',
    deSetor: 'Gerência Financeira',
    paraSetor: 'Gerência de Projetos',
    despacho: 'Faltam 6 notas fiscais para completar a prestação de contas.',
    tramitadoPorNome: 'Milena Costa',
    tramitadoEm: subDays(new Date(), 4).toISOString(),
  },
  {
    id: 'tram_12',
    protocoloSagi: '1520/2026',
    deSetor: 'Gerência de Projetos',
    paraSetor: 'Compras e Licitações',
    despacho: 'Solicitar notas fiscais pendentes junto aos fornecedores.',
    tramitadoPorNome: 'Nívea Sousa',
    tramitadoEm: subDays(new Date(), 2).toISOString(),
  },

  // Protocolo 1519/2026 — 6 movimentações
  {
    id: 'tram_13',
    protocoloSagi: '1519/2026',
    deSetor: 'Gerência de Projetos',
    paraSetor: 'Jurídico',
    despacho: 'Elaborar parecer sobre viabilidade de termo aditivo de prorrogação.',
    tramitadoPorNome: 'Misael Araújo',
    tramitadoEm: subDays(new Date(), 12).toISOString(),
  },
  {
    id: 'tram_14',
    protocoloSagi: '1519/2026',
    deSetor: 'Jurídico',
    paraSetor: 'Gerência de Projetos',
    despacho: 'Parecer favorável à prorrogação. Minutar o aditivo.',
    tramitadoPorNome: 'Jéssica Lima',
    tramitadoEm: subDays(new Date(), 8).toISOString(),
  },
  {
    id: 'tram_15',
    protocoloSagi: '1519/2026',
    deSetor: 'Gerência de Projetos',
    paraSetor: 'Diretoria Executiva',
    despacho: 'Aditivo minutado. Solicitar aprovação da Diretoria.',
    tramitadoPorNome: 'Matusalá Rodrigues',
    tramitadoEm: subDays(new Date(), 6).toISOString(),
  },
  {
    id: 'tram_16',
    protocoloSagi: '1519/2026',
    deSetor: 'Diretoria Executiva',
    paraSetor: 'Superintendência',
    despacho: 'Aprovado. Encaminho para assinatura do Superintendente.',
    tramitadoPorNome: 'Carlos Mendes',
    tramitadoEm: subDays(new Date(), 4).toISOString(),
  },
  {
    id: 'tram_17',
    protocoloSagi: '1519/2026',
    deSetor: 'Superintendência',
    paraSetor: 'Gerência de Projetos',
    despacho: 'Assinado. Providenciar publicação no DOU.',
    tramitadoPorNome: 'João Almeida',
    tramitadoEm: subDays(new Date(), 2).toISOString(),
  },
  {
    id: 'tram_18',
    protocoloSagi: '1519/2026',
    deSetor: 'Gerência de Projetos',
    paraSetor: 'Gerência Administrativa',
    despacho: null,
    tramitadoPorNome: 'Matusalá Rodrigues',
    tramitadoEm: subDays(new Date(), 1).toISOString(),
  },

  // Protocolo 1517/2026 — 3 movimentações
  {
    id: 'tram_19',
    protocoloSagi: '1517/2026',
    deSetor: 'Gerência de TI',
    paraSetor: 'Compras e Licitações',
    despacho: 'Solicitar cotação de licenças Microsoft 365 para 50 usuários.',
    tramitadoPorNome: 'Vinicius Silva',
    tramitadoEm: subDays(new Date(), 7).toISOString(),
  },
  {
    id: 'tram_20',
    protocoloSagi: '1517/2026',
    deSetor: 'Compras e Licitações',
    paraSetor: 'Gerência de TI',
    despacho: 'Cotação realizada. 3 propostas recebidas. Menor preço: R$ 12.500,00.',
    tramitadoPorNome: 'Roberto Carvalho',
    tramitadoEm: subDays(new Date(), 5).toISOString(),
  },
  {
    id: 'tram_21',
    protocoloSagi: '1517/2026',
    deSetor: 'Gerência de TI',
    paraSetor: 'Diretoria Executiva',
    despacho: 'Encaminho para aprovação da compra. Justificativa técnica em anexo.',
    tramitadoPorNome: 'Tawan Barbosa',
    tramitadoEm: subDays(new Date(), 3).toISOString(),
  },

  // Protocolo 1514/2026 — 2 movimentações
  {
    id: 'tram_22',
    protocoloSagi: '1514/2026',
    deSetor: 'Gerência de Projetos',
    paraSetor: 'Gerência Financeira',
    despacho: 'Solicitar pagamento de diárias conforme relatório de viagem anexo.',
    tramitadoPorNome: 'Matusalá Rodrigues',
    tramitadoEm: subDays(new Date(), 9).toISOString(),
  },
  {
    id: 'tram_23',
    protocoloSagi: '1514/2026',
    deSetor: 'Gerência Financeira',
    paraSetor: 'Gerência de Projetos',
    despacho: 'Pagamento efetuado via transferência bancária.',
    tramitadoPorNome: 'Milena Costa',
    tramitadoEm: subDays(new Date(), 7).toISOString(),
  },
];

/** Retorna tramitações de um protocolo específico (ordem cronológica) */
export function getTramitacoesByProtocolo(
  protocoloSagi: string
): TramitacaoSagi[] {
  return mockTramitacoes
    .filter((t) => t.protocoloSagi === protocoloSagi)
    .sort(
      (a, b) =>
        new Date(a.tramitadoEm).getTime() - new Date(b.tramitadoEm).getTime()
    );
}
