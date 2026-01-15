import React, { createContext, useContext, useState, useEffect } from 'react';

type AuthContextType = {
  isAuthenticated: boolean;
  user: { email: string; role: string; name: string; fullName: string } | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, token: string, role?: string, name?: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Decodificar payload del JWT sin validar firma (el backend lo valida)
 * 
 * SEGURIDAD (PBI-7, PBI-14, PBI-8):
 * - El JWT está diseñado para que el payload sea legible (no encriptado)
 * - La seguridad está en la firma (validada por backend con su clave secreta)
 * - Un atacante que vea el payload NO puede crear un JWT válido sin la clave
 * - Frontend solo decodifica para UX (mostrar datos mientras se carga)
 * - Backend valida la firma en CADA request → 401 si token expiró/falso
 * - localStorage es públicamente accesible pero eso es esperado:
 *   si un atacante ya tiene acceso (XSS), ya ganó - esto no lo hace peor
 */
function decodeJWT(token: string): { email?: string; role?: string; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decodificar payload (base64url → base64 → JSON)
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.warn('Error decodificando JWT:', error);
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ email: string; role: string; name: string; fullName: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * PBI-7: Restaurar sesión desde localStorage de forma segura
   * 
   * Lógica:
   * 1. Leer token de localStorage
   * 2. Decodificar JWT payload (sin validar firma, eso es del backend)
   * 3. Restaurar datos en estado React
   * 4. Si en el próximo request el backend rechaza con 401 → logout automático
   * 
   * PBI-14: NO guardamos datos sensibles en localStorage
   * - Solo el token JWT (que puede ser leído por JavaScript)
   * - Datos del usuario se guardan en estado React (en memoria)
   * - Si recargamos la página, se decodifican del JWT
   */
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const storedToken = localStorage.getItem('sirona_token');
        
        if (!storedToken) {
          setIsLoading(false);
          return;
        }

        // Decodificar payload del JWT
        const payload = decodeJWT(storedToken);
        
        if (!payload || !payload.email) {
          // Token inválido
          localStorage.removeItem('sirona_token');
          setIsLoading(false);
          return;
        }

        // PBI-8: Verificar si el token expiró (exp es timestamp en segundos)
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          // Token expirado, hacer logout
          console.warn('❌ Token expirado');
          localStorage.removeItem('sirona_token');
          setIsLoading(false);
          return;
        }

        // Restaurar sesión desde el JWT decodificado
        setToken(storedToken);
        setUser({
          email: payload.email || '',
          role: payload.role || 'usuario',
          name: '',
          fullName: '',
        });
        setIsAuthenticated(true);
        
        console.log('✅ Sesión restaurada desde JWT en localStorage');
      } catch (error) {
        console.error('Error durante inicialización de sesión:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, []);

  /**
   * PBI-7, PBI-14: Login seguro
   * - Guardamos SOLO el token en localStorage
   * - Decodificamos el token para obtener datos del usuario
   * - No guardamos datos sensibles en localStorage
   */
  const login = (email: string, tokenValue: string, role = 'usuario', name = '') => {
    const userData = { email, role, name, fullName: name };
    setToken(tokenValue);
    setUser(userData);
    setIsAuthenticated(true);
    
    // PBI-14: SOLO guardar el token, NUNCA datos clínicos o sensibles
    localStorage.setItem('sirona_token', tokenValue);
    
    console.log('✅ Login exitoso - token guardado en localStorage');
  };

  /**
   * PBI-7: Logout seguro
   * - Limpiar estado en memoria (datos del usuario)
   * - Limpiar localStorage (token)
   * - PBI-14: Limpiar datos residuales
   */
  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('sirona_token');
    
    console.log('✅ Logout exitoso');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};
