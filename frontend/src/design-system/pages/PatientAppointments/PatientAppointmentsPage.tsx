import React, { useState, useEffect } from 'react';
import styles from './PatientAppointmentsPage.module.scss';
import { Container } from '../../atoms/Container/Container';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { ArrowLeft, AlertCircle, Calendar, Clock, User } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { LoadingSpinner } from '../../atoms/LoadingSpinner/LoadingSpinner';
import { PageHeader } from '../../molecules/PageHeader/PageHeader';
import { NoResults } from '../../molecules/NoResults/NoResults';
import { PatientApiService, type AppointmentResponse } from '../../../services/api';

export const PatientAppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAppointments = async () => {
      if (!token) {
        setError('No se encontró token de autenticación');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await PatientApiService.getMyAppointments(token);
        setAppointments(data);
      } catch (err: unknown) {
        console.error('Error loading appointments:', err);
        const errorObj = err as { status?: number; detail?: string; message?: string };
        
        if (errorObj.status === 401) {
          setError('Sesión expirada. Redirigiendo al login...');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        
        setError(errorObj.detail || errorObj.message || 'Error al cargar las citas');
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [navigate, token]);

  const getStatusBadge = (estado: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      'Programada': { label: 'Programada', className: styles.statusProgramada },
      'Completada': { label: 'Completada', className: styles.statusCompletada },
      'Cancelada': { label: 'Cancelada', className: styles.statusCancelada },
      'No Asistió': { label: 'No Asistió', className: styles.statusNoAsistio },
    };
    
    const status = statusMap[estado] || { label: estado, className: '' };
    return <span className={`${styles.statusBadge} ${status.className}`}>{status.label}</span>;
  };

  return (
    <Container>
      <main className={styles.main}>
        <div className={styles.backButton}>
          <Button
            variant="filled"
            color="secondary"
            onClick={() => navigate('/inicio')}
            startIcon={<ArrowLeft size={16} />}
          >
            Volver
          </Button>
        </div>

        <PageHeader
          title="Mis Citas"
          icon={<Calendar size={32} />}
          subtitle="Historial de citas médicas programadas"
        />

        {loading && (
          <LoadingSpinner
            variant="bouncing-role"
            role="Paciente"
            message="Cargando tus citas..."
            size="large"
          />
        )}

        {error && (
          <div className={styles.errorContainer}>
            <AlertCircle size={48} className={styles.errorIcon} />
            <h2>Error</h2>
            <p className={styles.errorMessage}>{error}</p>
            <Button
              variant="filled"
              color="primary"
              onClick={() => navigate('/inicio')}
              startIcon={<ArrowLeft size={16} />}
            >
              Volver al Inicio
            </Button>
          </div>
        )}

        {!loading && !error && appointments.length === 0 && (
          <NoResults
            title="Sin Citas Registradas"
            description="Aún no tienes citas médicas agendadas. Contacta con tu centro médico para agendar una cita."
            icon={<Calendar size={48} />}
            fullHeight
          />
        )}

        {!loading && !error && appointments.length > 0 && (
          <div className={styles.appointmentsContainer}>
            <div className={styles.statsCard}>
              <div className={styles.statItem}>
                <Calendar size={24} />
                <div className={styles.statContent}>
                  <span className={styles.statValue}>{appointments.length}</span>
                  <span className={styles.statLabel}>Total de citas</span>
                </div>
              </div>
              <div className={styles.statItem}>
                <Clock size={24} />
                <div className={styles.statContent}>
                  <span className={styles.statValue}>
                    {appointments.filter(a => a.estado === 'Programada').length}
                  </span>
                  <span className={styles.statLabel}>Programadas</span>
                </div>
              </div>
              <div className={styles.statItem}>
                <User size={24} />
                <div className={styles.statContent}>
                  <span className={styles.statValue}>
                    {appointments.filter(a => a.estado === 'Completada').length}
                  </span>
                  <span className={styles.statLabel}>Completadas</span>
                </div>
              </div>
            </div>

            <div className={styles.appointmentsList}>
              {appointments.map((apt) => (
                <div key={apt.id} className={styles.appointmentCard}>
                  <div className={styles.appointmentHeader}>
                    <div className={styles.appointmentDate}>
                      <Calendar size={20} />
                      <span className={styles.dateText}>
                        {new Date(apt.fecha).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    {getStatusBadge(apt.estado)}
                  </div>

                  <div className={styles.appointmentBody}>
                    <div className={styles.timeInfo}>
                      <Clock size={18} />
                      <span>
                        {new Date(apt.fecha).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className={styles.doctorInfo}>
                      <User size={18} />
                      <span>{apt.doctorName}</span>
                    </div>

                    <div className={styles.motivoInfo}>
                      <strong>Motivo:</strong> {apt.motivo}
                    </div>

                    {apt.notas && (
                      <div className={styles.notasInfo}>
                        <strong>Notas:</strong> {apt.notas}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </Container>
  );
};
