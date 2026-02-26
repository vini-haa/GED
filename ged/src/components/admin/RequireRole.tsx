'use client';

import { usePermissions } from '@/hooks/use-permissions';
import { AccessDenied } from './AccessDenied';
import type { GedRole } from '@/lib/auth';

interface RequireRoleProps {
  requiredRole: GedRole;
  children: React.ReactNode;
}

export function RequireRole({ requiredRole, children }: RequireRoleProps) {
  const { hasRole } = usePermissions();

  if (!hasRole(requiredRole)) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
