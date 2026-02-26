import { subDays, subHours, subMinutes } from 'date-fns';
import type { Observacao } from './types';

export const mockObservacoes: Observacao[] = [
  // Protocolo 1523/2026 — 5 observações (2 recentes < 48h)
  {
    id: 'obs_1',
    protocoloSagi: '1523/2026',
    texto:
      'Documento de empenho recebido pela Gerência Financeira. Aguardando análise do saldo disponível na rubrica 33.90.39.',
    autorEmail: 'milena@fadex.org.br',
    autorNome: 'Milena Costa',
    autorSetor: 'Gerência Financeira',
    importante: true,
    criadoEm: subHours(new Date(), 4).toISOString(),
    editadoEm: null,
  },
  {
    id: 'obs_2',
    protocoloSagi: '1523/2026',
    texto:
      'Verificar se o coordenador enviou a declaração de contrapartida atualizada. Prazo final para envio é 05/03.',
    autorEmail: 'luanna@fadex.org.br',
    autorNome: 'Luanna Oliveira',
    autorSetor: 'Gerência de Projetos',
    importante: false,
    criadoEm: subHours(new Date(), 18).toISOString(),
    editadoEm: null,
  },
  {
    id: 'obs_3',
    protocoloSagi: '1523/2026',
    texto:
      'Protocolo encaminhado para análise jurídica conforme solicitação da coordenação do projeto.',
    autorEmail: 'reinaldo@fadex.org.br',
    autorNome: 'Reinaldo Santos',
    autorSetor: 'Gerência de Projetos',
    importante: false,
    criadoEm: subDays(new Date(), 2).toISOString(),
    editadoEm: subDays(new Date(), 1).toISOString(),
  },
  {
    id: 'obs_4',
    protocoloSagi: '1523/2026',
    texto: 'Parecer jurídico favorável. Pode prosseguir com o empenho.',
    autorEmail: 'jessica@fadex.org.br',
    autorNome: 'Jéssica Lima',
    autorSetor: 'Jurídico',
    importante: true,
    criadoEm: subDays(new Date(), 1).toISOString(),
    editadoEm: null,
  },
  {
    id: 'obs_5',
    protocoloSagi: '1523/2026',
    texto:
      'Nota de empenho gerada com sucesso. Número: 2026NE000345. Valor: R$ 45.000,00.',
    autorEmail: 'milena@fadex.org.br',
    autorNome: 'Milena Costa',
    autorSetor: 'Gerência Financeira',
    importante: false,
    criadoEm: subMinutes(new Date(), 30).toISOString(),
    editadoEm: null,
  },

  // Protocolo 1521/2026 — 3 observações (1 recente < 48h)
  {
    id: 'obs_6',
    protocoloSagi: '1521/2026',
    texto:
      'Processo de contratação de bolsista iniciado. Aguardando documentação do candidato selecionado.',
    autorEmail: 'bruna@fadex.org.br',
    autorNome: 'Bruna Ferreira',
    autorSetor: 'Gerência de Projetos',
    importante: false,
    criadoEm: subDays(new Date(), 3).toISOString(),
    editadoEm: null,
  },
  {
    id: 'obs_7',
    protocoloSagi: '1521/2026',
    texto:
      'RH confirmou disponibilidade de vaga. Candidato deve comparecer para assinar termo de compromisso até sexta-feira.',
    autorEmail: 'pricyla@fadex.org.br',
    autorNome: 'Pricyla Andrade',
    autorSetor: 'Recursos Humanos',
    importante: true,
    criadoEm: subHours(new Date(), 6).toISOString(),
    editadoEm: null,
  },
  {
    id: 'obs_8',
    protocoloSagi: '1521/2026',
    texto: 'Currículo do candidato analisado e aprovado pela coordenação.',
    autorEmail: 'matusala@fadex.org.br',
    autorNome: 'Matusalá Rodrigues',
    autorSetor: 'Gerência de Projetos',
    importante: false,
    criadoEm: subDays(new Date(), 2).toISOString(),
    editadoEm: null,
  },

  // Protocolo 1520/2026 — 4 observações
  {
    id: 'obs_9',
    protocoloSagi: '1520/2026',
    texto:
      'Iniciada a prestação de contas do 1º trimestre. Documentação parcial já anexada ao sistema.',
    autorEmail: 'nivea@fadex.org.br',
    autorNome: 'Nívea Sousa',
    autorSetor: 'Gerência de Projetos',
    importante: false,
    criadoEm: subDays(new Date(), 5).toISOString(),
    editadoEm: null,
  },
  {
    id: 'obs_10',
    protocoloSagi: '1520/2026',
    texto:
      'ATENÇÃO: Prazo de prestação de contas vence em 10/03/2026. Faltam 6 notas fiscais.',
    autorEmail: 'milena@fadex.org.br',
    autorNome: 'Milena Costa',
    autorSetor: 'Gerência Financeira',
    importante: true,
    criadoEm: subDays(new Date(), 3).toISOString(),
    editadoEm: null,
  },
  {
    id: 'obs_11',
    protocoloSagi: '1520/2026',
    texto:
      'Notas fiscais 007 a 010 anexadas. Restam NFs 011 e 012 (aguardando fornecedor).',
    autorEmail: 'nivea@fadex.org.br',
    autorNome: 'Nívea Sousa',
    autorSetor: 'Gerência de Projetos',
    importante: false,
    criadoEm: subDays(new Date(), 1).toISOString(),
    editadoEm: null,
  },
  {
    id: 'obs_12',
    protocoloSagi: '1520/2026',
    texto: 'Fornecedor confirmou envio das NFs restantes até amanhã.',
    autorEmail: 'claudiane@fadex.org.br',
    autorNome: 'Claudiane Mendes',
    autorSetor: 'Compras e Licitações',
    importante: false,
    criadoEm: subHours(new Date(), 2).toISOString(),
    editadoEm: null,
  },

  // Protocolo 1519/2026 — 4 observações
  {
    id: 'obs_13',
    protocoloSagi: '1519/2026',
    texto:
      'Termo aditivo de prorrogação elaborado. Vigência estendida por mais 6 meses (até 31/12/2026).',
    autorEmail: 'misael@fadex.org.br',
    autorNome: 'Misael Araújo',
    autorSetor: 'Gerência de Projetos',
    importante: false,
    criadoEm: subDays(new Date(), 6).toISOString(),
    editadoEm: null,
  },
  {
    id: 'obs_14',
    protocoloSagi: '1519/2026',
    texto:
      'Parecer jurídico sobre o aditivo será emitido em até 5 dias úteis.',
    autorEmail: 'jessica@fadex.org.br',
    autorNome: 'Jéssica Lima',
    autorSetor: 'Jurídico',
    importante: false,
    criadoEm: subDays(new Date(), 5).toISOString(),
    editadoEm: null,
  },
  {
    id: 'obs_15',
    protocoloSagi: '1519/2026',
    texto: 'Parecer jurídico emitido e favorável à prorrogação do convênio.',
    autorEmail: 'jessica@fadex.org.br',
    autorNome: 'Jéssica Lima',
    autorSetor: 'Jurídico',
    importante: true,
    criadoEm: subDays(new Date(), 3).toISOString(),
    editadoEm: null,
  },
  {
    id: 'obs_16',
    protocoloSagi: '1519/2026',
    texto:
      'Aditivo assinado pelas partes. Publicação no DOU prevista para próxima semana.',
    autorEmail: 'matusala@fadex.org.br',
    autorNome: 'Matusalá Rodrigues',
    autorSetor: 'Gerência de Projetos',
    importante: false,
    criadoEm: subDays(new Date(), 1).toISOString(),
    editadoEm: null,
  },

  // Protocolo 1517/2026 — 2 observações
  {
    id: 'obs_17',
    protocoloSagi: '1517/2026',
    texto:
      'Cotação de licenças realizada com 3 fornecedores. Menor preço: R$ 12.500,00 (Microsoft CSP).',
    autorEmail: 'vinicius@fadex.org.br',
    autorNome: 'Vinicius Silva',
    autorSetor: 'Gerência de TI',
    importante: false,
    criadoEm: subDays(new Date(), 5).toISOString(),
    editadoEm: null,
  },
  {
    id: 'obs_18',
    protocoloSagi: '1517/2026',
    texto:
      'Compra aprovada pela Diretoria. Aguardando emissão de ordem de compra pelo setor de Compras.',
    autorEmail: 'tawan@fadex.org.br',
    autorNome: 'Tawan Barbosa',
    autorSetor: 'Gerência de TI',
    importante: false,
    criadoEm: subDays(new Date(), 3).toISOString(),
    editadoEm: null,
  },
];

/** Retorna observações de um protocolo específico */
export function getObservacoesByProtocolo(
  protocoloSagi: string
): Observacao[] {
  return mockObservacoes.filter((o) => o.protocoloSagi === protocoloSagi);
}
