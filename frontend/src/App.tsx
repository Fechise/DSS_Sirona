import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './design-system/layouts/AppLayout';
import { LandingPage } from './design-system/pages/Landing/LandingPage';
import { LoginPage } from './design-system/pages/Login/LoginPage';
import { RegisterPage } from './design-system/pages/Register/RegisterPage';
import { MedicalRecordPage } from './design-system/pages/MedicalRecord/MedicalRecordPage';
import { PaginaInicio } from './design-system/pages/Home/HomePage';
import { UserManagementPage } from './design-system/pages/UserManagement/UserManagementPage';
import { DoctorPatientsPage } from './design-system/pages/DoctorPatients/DoctorPatientsPage';
import { PatientRecordPage } from './design-system/pages/PatientRecord/PatientRecordPage';
import { PatientHistoryPage } from './design-system/pages/PatientHistory/PatientHistoryPage';
import { ProfilePage } from './design-system/pages/Profile/ProfilePage';
import { AppointmentSchedulingPage } from './design-system/pages/AppointmentScheduling/AppointmentSchedulingPage';
import { PaymentCheckoutPage } from './design-system/pages/PaymentCheckout/PaymentCheckoutPage';
import { PatientListPage } from './design-system/pages/PatientList/PatientListPage';
import { SecretaryUserRegisterPage } from './design-system/pages/SecretaryUserRegister/SecretaryUserRegisterPage';
import { DoctorAvailabilityPage } from './design-system/pages/DoctorAvailability/DoctorAvailabilityPage';
import { DoctorAppointmentsPage } from './design-system/pages/DoctorAppointments/DoctorAppointmentsPage';
import { AuditLogsPage } from './design-system/pages/AuditLogs/AuditLogsPage';

const RedireccionInicio: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? '/inicio' : '/'} replace />;
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/inicio"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PaginaInicio />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/historiales"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MedicalRecordPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProfilePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <ProtectedRoute requiredRole="Administrador">
                <AppLayout>
                  <UserManagementPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/logs"
            element={
              <ProtectedRoute requiredRole="Administrador">
                <AppLayout>
                  <AuditLogsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/medico/pacientes"
            element={
              <ProtectedRoute requiredRole="Médico">
                <AppLayout>
                  <DoctorPatientsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/medico/disponibilidad"
            element={
              <ProtectedRoute requiredRole="Médico">
                <AppLayout>
                  <DoctorAvailabilityPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/medico/citas"
            element={
              <ProtectedRoute requiredRole="Médico">
                <AppLayout>
                  <DoctorAppointmentsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/medico/pacientes/:patientId/historial"
            element={
              <ProtectedRoute requiredRole="Médico">
                <AppLayout>
                  <PatientRecordPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/paciente/mi-historial"
            element={
              <ProtectedRoute requiredRole="Paciente">
                <AppLayout>
                  <PatientHistoryPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pagos/checkout"
            element={
              <ProtectedRoute requiredRole="Paciente">
                <AppLayout>
                  <PaymentCheckoutPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/secretario/registro-usuario"
            element={
              <ProtectedRoute requiredRole="Secretario">
                <AppLayout>
                  <SecretaryUserRegisterPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/secretario/citas"
            element={
              <ProtectedRoute requiredRole="Secretario">
                <AppLayout>
                  <AppointmentSchedulingPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/secretario/pacientes"
            element={
              <ProtectedRoute requiredRole="Secretario">
                <AppLayout>
                  <PatientListPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/secretario/citas"
            element={
              <ProtectedRoute requiredRole="Secretario">
                <AppLayout>
                  <AppointmentSchedulingPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pacientes"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PatientListPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<RedireccionInicio />} />
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
