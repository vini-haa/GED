'use client';

import { ProtocoloCounters } from '@/components/protocolos/ProtocoloCounters';
import { ProtocoloTabs } from '@/components/protocolos/ProtocoloTabs';
import { useUserSector } from '@/hooks/use-user-sector';
import { FileText } from 'lucide-react';

export default function ProtocolosPage() {
  const { codSetor } = useUserSector();
  const setorNumerico = codSetor && !isNaN(Number(codSetor)) ? Number(codSetor) : null;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Protocolos</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie e acompanhe todos os protocolos do seu setor.
        </p>
      </div>
      <ProtocoloCounters setor={setorNumerico} />
      <ProtocoloTabs />
    </div>
  );
}
