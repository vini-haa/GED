'use client';

import { useMemo } from 'react';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import type { GedRole, User } from '@/lib/auth';

interface UsePermissionsReturn {
  user: User;
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
  const user = getCurrentUser();

  return useMemo(() => {
    const role = user.gedRole;
    const isSuperAdmin = hasPermission(user, 'super_admin');
    const isAdmin = hasPermission(user, 'admin');
    const isOperator = hasPermission(user, 'operator');
    const isViewer = role === 'viewer';

    return {
      user,
      role,
      isSuperAdmin,
      isAdmin,
      isOperator: isOperator && !isAdmin,
      isViewer,
      canManageDocumentTypes: isAdmin,
      canManageAdmins: isSuperAdmin,
      canViewLogs: isAdmin,
      canUpload: hasPermission(user, 'operator'),
      canDelete: isAdmin,
      canEdit: hasPermission(user, 'operator'),
      hasRole: (requiredRole: GedRole) => hasPermission(user, requiredRole),
    };
  }, [user]);
}
