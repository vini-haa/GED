'use client';

import { useMemo } from 'react';
import { hasRolePermission, mapBackendRole } from '@/lib/auth';
import type { GedRole } from '@/lib/auth';
import { useCurrentUser } from '@/hooks/use-user-sector';

interface UsePermissionsReturn {
  user: {
    email: string;
    nome: string;
    role: string;
    gedRole: GedRole;
    setor: string;
  } | null;
  isLoading: boolean;
  role: GedRole;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isOperator: boolean;
  isViewer: boolean;
  canManageDocumentTypes: boolean;
  canManageAdmins: boolean;
  canViewLogs: boolean;
  canUpload: boolean;
  canDelete: boolean;
  canEdit: boolean;
  hasRole: (requiredRole: GedRole) => boolean;
}

export function usePermissions(): UsePermissionsReturn {
  const { data: currentUser, isLoading } = useCurrentUser();

  return useMemo(() => {
    if (!currentUser) {
      return {
        user: null,
        isLoading,
        role: 'viewer' as GedRole,
        isSuperAdmin: false,
        isAdmin: false,
        isOperator: false,
        isViewer: true,
        canManageDocumentTypes: false,
        canManageAdmins: false,
        canViewLogs: false,
        canUpload: false,
        canDelete: false,
        canEdit: false,
        hasRole: () => false,
      };
    }

    const gedRole = mapBackendRole(currentUser.role);

    const user = {
      email: currentUser.email,
      nome: currentUser.nome,
      role: currentUser.role,
      gedRole,
      setor: currentUser.setor ?? '',
    };

    const superAdmin = hasRolePermission(gedRole, 'super_admin');
    const admin = hasRolePermission(gedRole, 'admin');
    const operator = hasRolePermission(gedRole, 'operator');

    return {
      user,
      isLoading,
      role: gedRole,
      isSuperAdmin: superAdmin,
      isAdmin: admin,
      isOperator: operator && !admin,
      isViewer: gedRole === 'viewer',
      canManageDocumentTypes: admin,
      canManageAdmins: superAdmin,
      canViewLogs: admin,
      canUpload: operator,
      canDelete: admin,
      canEdit: operator,
      hasRole: (requiredRole: GedRole) =>
        hasRolePermission(gedRole, requiredRole),
    };
  }, [currentUser, isLoading]);
}
