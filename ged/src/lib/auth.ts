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

export const mockUser: User = {
  id: 'usr_1',
  name: 'Suporte TI',
  email: 'suporteti@fadex.org.br',
  role: 'MEMBER',
  codSetor: 5,
  nomeSetor: 'Gerência de TI',
  gedRole: 'super_admin',
};

export function getCurrentUser(): User {
  return mockUser;
}

export function hasPermission(user: User, requiredRole: GedRole): boolean {
  return GED_ROLE_HIERARCHY[user.gedRole] >= GED_ROLE_HIERARCHY[requiredRole];
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
