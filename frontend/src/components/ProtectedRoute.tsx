import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Forbidden403Page } from '../design-system/pages/Forbidden403/Forbidden403Page';

type ProtectedRouteProps = {
  children: React.ReactNode;
  requiredRole?: string;
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // PBI-7, PBI-14: Mostrar loading mientras se decodifica JWT desde localStorage
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Cargando sesión...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirigir a login si no está autenticado
    return <Navigate to="/login" replace />;
  }

  // Protección PBI-16: Secretario no puede acceder a historiales clínicos
  if (user?.role === 'Secretario' && (location.pathname.includes('/historial') || location.pathname === '/historiales')) {
    return <Forbidden403Page />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Redirigir a inicio si no tiene el rol requerido
    return <Navigate to="/inicio" replace />;
  }

  return <>{children}</>;
};
