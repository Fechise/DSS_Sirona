import React, { createContext, useContext, useState, useEffect } from 'react';

type AuthContextType = {
  isAuthenticated: boolean;
  user: { email: string; role: string; name: string } | null;
  token: string | null;
  login: (email: string, token: string, role?: string, name?: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ email: string; role: string; name: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Al cargar, revisar si hay sesión guardada (localStorage)
  useEffect(() => {
    const storedToken = localStorage.getItem('sirona_token');
    const storedUser = localStorage.getItem('sirona_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const login = (email: string, tokenValue: string, role = 'user', name = '') => {
    const userData = { email, role, name };
    setToken(tokenValue);
    setUser(userData);
    setIsAuthenticated(true);
    // Persistir en localStorage
    localStorage.setItem('sirona_token', tokenValue);
    localStorage.setItem('sirona_user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('sirona_token');
    localStorage.removeItem('sirona_user');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout }}>
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
