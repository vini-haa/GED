export type ProtocolStatus =
  | 'Em Andamento'
  | 'Concluído'
  | 'Pendente'
  | 'Cancelado';

export type Protocol = {
  id: string;
  number: string;
  project: string;
  interestedParty: string;
  status: ProtocolStatus;
  documentCount: number;
  lastUpdated: string; // ISO date string
};
