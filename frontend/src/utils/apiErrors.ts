/**
 * Utility functions for handling API errors, especially authentication and authorization errors
 */

export type ApiErrorType = 'unauthorized' | 'forbidden' | 'network' | 'server' | 'unknown';

export interface ApiErrorInfo {
  type: ApiErrorType;
  message: string;
  shouldLogout: boolean;
  shouldRedirect: boolean;
}

/**
 * Analyzes an HTTP error response and returns structured error information
 */
export const handleApiError = (status: number, errorData?: any): ApiErrorInfo => {
  switch (status) {
    case 401:
      return {
        type: 'unauthorized',
        message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        shouldLogout: true,
        shouldRedirect: true,
      };
    
    case 403:
      return {
        type: 'forbidden',
        message: 'No tienes permisos para acceder a este recurso.',
        shouldLogout: false,
        shouldRedirect: false,
      };
    
    case 404:
      return {
        type: 'unknown',
        message: 'El recurso solicitado no fue encontrado.',
        shouldLogout: false,
        shouldRedirect: false,
      };
    
    case 500:
    case 502:
    case 503:
      return {
        type: 'server',
        message: 'Error del servidor. Por favor, intenta más tarde.',
        shouldLogout: false,
        shouldRedirect: false,
      };
    
    default:
      return {
        type: 'unknown',
        message: errorData?.message || 'Ocurrió un error inesperado.',
        shouldLogout: false,
        shouldRedirect: false,
      };
  }
};

/**
 * Checks if an error is an authorization error (401 or 403)
 */
export const isAuthError = (status: number): boolean => {
  return status === 401 || status === 403;
};

/**
 * Checks if the session has expired (401)
 */
export const isSessionExpired = (status: number): boolean => {
  return status === 401;
};
