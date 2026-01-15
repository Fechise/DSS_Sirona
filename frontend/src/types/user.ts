/**
 * Tipos y utilidades para roles de usuario en Sirona
 */

export type UserRole = 'Administrador' | 'Médico' | 'Paciente' | 'Secretario';

export type UserStatus = 'Activo' | 'Inactivo' | 'Bloqueado';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
  lastLogin?: string;
}

/**
 * Verifica si un usuario tiene un rol específico
 */
export function hasRole(userRole: string | undefined, requiredRole: UserRole): boolean {
  return userRole === requiredRole;
}

/**
 * Verifica si un usuario es administrador
 */
export function isAdmin(userRole: string | undefined): boolean {
  return hasRole(userRole, 'Administrador');
}

/**
 * Obtiene el color asociado a un rol (para badges)
 */
export function getRoleColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    Administrador: 'var(--error-color)',
    Médico: 'var(--primary-color)',
    Paciente: 'var(--secondary-color)',
    Secretario: 'var(--warning-color)',
  };
  return colors[role];
}

/**
 * Obtiene el color asociado a un estado (para badges)
 */
export function getStatusColor(status: UserStatus): string {
  const colors: Record<UserStatus, string> = {
    Activo: 'var(--success-color)',
    Inactivo: 'var(--border-color)',
    Bloqueado: 'var(--error-color)',
  };
  return colors[status];
}

/**
 * Lista completa de roles disponibles
 */
export const ALL_ROLES: UserRole[] = [
  'Administrador',
  'Médico',
  'Paciente',
  'Secretario',
];

/**
 * Permisos asociados a cada rol (para futura expansión)
 */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  Administrador: ['manage_users', 'manage_roles', 'view_all_records', 'manage_system'],
  Médico: ['view_records', 'edit_records', 'create_records'],
  Secretario: ['view_records', 'schedule_appointments'],
  Paciente: ['view_own_records'],
};
