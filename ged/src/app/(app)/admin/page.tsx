'use client';

import { AccessDenied } from '@/components/admin/AccessDenied';
import { getCurrentUser, isAdmin } from '@/lib/auth';

export default function AdminPage() {
  const user = getCurrentUser();

  if (!isAdmin(user)) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Administração</h1>
      <p className="text-muted-foreground">
        Painel administrativo do GED FADEX. Em construção.
      </p>
    </div>
  );
}
