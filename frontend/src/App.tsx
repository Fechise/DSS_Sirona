import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './design-system/pages/Login/LoginPage';
import { RegisterPage } from './design-system/pages/Register/RegisterPage';
import { MedicalRecordPage } from './design-system/pages/MedicalRecord/MedicalRecordPage';
import { PaginaInicio } from './design-system/pages/Home/HomePage';
import { ChangePasswordPage } from './design-system/pages/ChangePassword/ChangePasswordPage';
import { UserManagementPage } from './design-system/pages/UserManagement/UserManagementPage';

const RutaInicial: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? '/inicio' : '/login'} replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/inicio"
            element={
              <ProtectedRoute>
                <PaginaInicio />
              </ProtectedRoute>
            }
          />
          <Route
            path="/historiales"
            element={
              <ProtectedRoute>
                <MedicalRecordPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cambiar-contrasena"
            element={
              <ProtectedRoute>
                <ChangePasswordPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <ProtectedRoute requiredRole="Administrador">
                <UserManagementPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<RutaInicial />} />
          <Route path="*" element={<RutaInicial />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
