'use client';

import { Users } from 'lucide-react';

export function AdminsTab() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-card/50 py-16">
      <Users className="mb-3 h-10 w-10 text-muted-foreground/50" />
      <p className="text-sm font-medium text-muted-foreground">
        Gerenciamento de Administradores
      </p>
      <p className="mt-1 text-xs text-muted-foreground/70">
        Disponível na Semana 9.
      </p>
    </div>
  );
}
