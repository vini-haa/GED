export type GedRole = 'super_admin' | 'admin' | 'operator' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  codSetor: number;
  nomeSetor: string;
  gedRole: GedRole;
}

const GED_ROLE_HIERARCHY: Record<GedRole, number> = {
  super_admin: 4,
  admin: 3,
  operator: 2,
  viewer: 1,
};

/**
 * Mapeia a role do backend Go (uppercase) para GedRole (lowercase).
 * Backend usa: SUPER_ADMIN, ADMIN, USER_SETOR, VIEWER
 */
export function mapBackendRole(backendRole: string): GedRole {
  switch (backendRole) {
    case 'SUPER_ADMIN':
      return 'super_admin';
    case 'ADMIN':
      return 'admin';
    case 'USER_SETOR':
    case 'OPERATOR':
      return 'operator';
    case 'VIEWER':
      return 'viewer';
    default:
      return 'viewer';
  }
}

export function hasPermission(user: User, requiredRole: GedRole): boolean {
  return GED_ROLE_HIERARCHY[user.gedRole] >= GED_ROLE_HIERARCHY[requiredRole];
}

export function hasRolePermission(
  gedRole: GedRole | undefined,
  requiredRole: GedRole
): boolean {
  if (!gedRole) return false;
  return GED_ROLE_HIERARCHY[gedRole] >= GED_ROLE_HIERARCHY[requiredRole];
}

export function isAdmin(user: User): boolean {
  return hasPermission(user, 'admin');
}

export function isSuperAdmin(user: User): boolean {
  return hasPermission(user, 'super_admin');
}

export function isOperator(user: User): boolean {
  return hasPermission(user, 'operator');
}
