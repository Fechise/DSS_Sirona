/**
 * Utilidades para manejar errores de autenticación
 * y detectar estados especiales como bloqueo de cuenta
 */

export interface AuthErrorResponse {
  account_locked?: boolean;
  locked_until?: string; // ISO 8601 timestamp
  message?: string;
  error?: string;
}

/**
 * Detecta si la respuesta del backend indica que la cuenta está bloqueada
 * @param response - Respuesta del backend
 * @returns true si la cuenta está bloqueada
 */
export function isAccountLocked(response: AuthErrorResponse): boolean {
  return response?.account_locked === true;
}

/**
 * Extrae el tiempo de bloqueo restante de la respuesta
 * @param response - Respuesta del backend
 * @returns Tiempo en minutos hasta que se debloquee la cuenta, o null
 */
export function getAccountLockTime(response: AuthErrorResponse): number | null {
  if (!response?.locked_until) return null;
  
  const now = new Date();
  const unlockedAt = new Date(response.locked_until);
  const diffMs = unlockedAt.getTime() - now.getTime();
  
  if (diffMs <= 0) return null;
  
  return Math.ceil(diffMs / 1000 / 60); // convertir a minutos
}

/**
 * Genera mensaje genérico para fallos de autenticación sin revelar información sensible
 * @param response - Respuesta del backend
 * @returns Mensaje seguro para mostrar al usuario
 */
export function getSecureAuthErrorMessage(response: AuthErrorResponse): string {
  if (isAccountLocked(response)) {
    return 'Cuenta bloqueada por 15 minutos';
  }
  
  // No revelar si el usuario existe o si la contraseña es incorrecta
  return 'Correo o contraseña inválidos';
}
