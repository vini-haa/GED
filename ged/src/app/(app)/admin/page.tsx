'use client';

import { FileText, Users, ScrollText, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RequireRole } from '@/components/admin/RequireRole';
import { TiposDocumentoTab } from '@/components/admin/TiposDocumentoTab';
import { AdminsTab } from '@/components/admin/AdminsTab';
import { LogsTab } from '@/components/admin/LogsTab';

export default function AdminPage() {
  return (
    <RequireRole requiredRole="admin">
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold tracking-tight">Administração</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie tipos de documento, administradores e visualize logs de atividade.
          </p>
        </div>

        <Tabs defaultValue="tipos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tipos" className="gap-2">
              <FileText className="h-4 w-4" />
              Tipos de Documento
            </TabsTrigger>
            <TabsTrigger value="admins" className="gap-2">
              <Users className="h-4 w-4" />
              Administradores
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <ScrollText className="h-4 w-4" />
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tipos">
            <TiposDocumentoTab />
          </TabsContent>

          <TabsContent value="admins">
            <AdminsTab />
          </TabsContent>

          <TabsContent value="logs">
            <LogsTab />
          </TabsContent>
        </Tabs>
      </div>
    </RequireRole>
  );
}
