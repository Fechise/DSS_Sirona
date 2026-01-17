import React, { useState, useEffect } from 'react';
import styles from './PatientHistoryPage.module.scss';
import { Container } from '../../atoms/Container/Container';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import {
  ArrowLeft,
  AlertCircle,
  FileText,
  Calendar,
  User,
  Clock
} from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { LoadingSpinner } from '../../atoms/LoadingSpinner/LoadingSpinner';
import {
  PersonalInfoSection,
  ContactInfoSection,
  ConsultasSection,
  VacunasSection,
  AntecedentesSection,
  ProximaCitaSection,
} from '../../organisms/SectionsPatientHistory';
import { AlertNote } from '../../molecules/AlertNote/AlertNote';
import { PageHeader } from '../../molecules/PageHeader/PageHeader';
import { PatientApiService, type AppointmentResponse } from '../../../services/api';

type MedicalRecord = {
  id: string;
  // Información Personal Médica
  tipoSangre: string;
  alergias: string[];
  condicionesCronicas: string[];
  medicamentosActuales: string[];
  
  // Información de Contacto
  medicoAsignado: {
    nombre: string;
    especialidad: string;
    telefono: string;
  };
  contactoEmergencia: {
    nombre: string;
    relacion: string;
    telefono: string;
  };
  
  // Historial de Consultas
  consultas: {
    id: string;
    fecha: string;
    motivo: string;
    diagnostico: string;
    tratamiento: string;
    notasMedico: string;
  }[];
  
  // Vacunas
  vacunas: {
    nombre: string;
    fecha: string;
    proximaDosis?: string;
  }[];
  
  // Antecedentes
  antecedentesFamiliares: string[];
  
  // Citas
  proximaCita?: {
    fecha: string;
    motivo: string;
    medico: string;
  };
  
  ultimaModificacion: string;
};

export const PatientHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<number | null>(null);

  useEffect(() => {
    const loadPatientData = async () => {
      if (!token) {
        setErrorCode(401);
        setError('No se encontró token de autenticación');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setErrorCode(null);
      
      try {
        // Cargar citas del paciente (siempre disponible)
        const appointmentsData = await PatientApiService.getMyAppointments(token);
        setAppointments(appointmentsData);
        
        // Intentar cargar historial médico
        try {
          const data = await PatientApiService.getMyHistory(token);
        
        // Mapear respuesta del backend al formato esperado
        const mappedRecord: MedicalRecord = {
          id: data.id,
          tipoSangre: data.tipoSangre || 'No especificado',
          alergias: data.alergias || [],
          condicionesCronicas: data.condicionesCronicas || [],
          medicamentosActuales: data.medicamentosActuales || [],
          medicoAsignado: data.medicoAsignado || {
            nombre: 'No asignado',
            especialidad: '',
            telefono: ''
          },
          contactoEmergencia: data.contactoEmergencia || {
            nombre: 'No registrado',
            relacion: '',
            telefono: ''
          },
          consultas: (data.consultas || []).map((c: { id: string; fecha: string; motivo: string; diagnostico: string; tratamiento: string; notasMedico: string }) => ({
            id: c.id,
            fecha: c.fecha,
            motivo: c.motivo,
            diagnostico: c.diagnostico,
            tratamiento: c.tratamiento,
            notasMedico: c.notasMedico
          })),
          vacunas: (data.vacunas || []).map((v: { nombre: string; fecha: string; proximaDosis?: string }) => ({
            nombre: v.nombre,
            fecha: v.fecha,
            proximaDosis: v.proximaDosis
          })),
          antecedentesFamiliares: data.antecedentesFamiliares || [],
          proximaCita: data.proximaCita ? {
            fecha: data.proximaCita.fecha,
            motivo: data.proximaCita.motivo,
            medico: data.proximaCita.medico
          } : undefined,
          ultimaModificacion: data.ultimaModificacion
        };
        
        setRecord(mappedRecord);
        } catch (historyErr: unknown) {
          // Si no hay historial, no es error crítico - el paciente puede ver sus citas
          const histErr = historyErr as { status?: number };
          if (histErr.status !== 404) {
            console.error('Error loading history:', historyErr);
          }
          // record queda como null, lo cual es válido
        }
      } catch (err: unknown) {
        console.error('Error loading patient data:', err);
        const errorObj = err as { status?: number; detail?: string; message?: string };
        
        if (errorObj.status === 401) {
          setErrorCode(401);
          setError('Sesión expirada. Redirigiendo al login...');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        if (errorObj.status === 403) {
          setErrorCode(403);
          setError('No tienes permisos para ver esta información');
          return;
        }
        
        setError(errorObj.detail || errorObj.message || 'Error al cargar los datos');
        setErrorCode(500);
      } finally {
        setLoading(false);
      }
    };

    loadPatientData();
  }, [navigate, token]);

  return (
    <>
      <Container>
        <div className={styles.page}>
          <div className={styles.pageHeader}>
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
              title="Mi Historial Clínico"
              icon={<FileText size={32} />}
              subtitle="Información médica personal y confidencial"
            />
          </div>

          {loading && (
            <LoadingSpinner
              variant="bouncing-role"
              role="Paciente"
              message="Cargando tu historial..."
              size="large"
            />
          )}

          {error && (
            <Container>
              <div className={styles.errorContainer}>
                <AlertCircle size={48} className={styles.errorIcon} />
                {errorCode === 401 ? (
                  <>
                    <h2>Sesión Expirada</h2>
                    <p className={styles.errorMessage}>
                      Tu sesión ha expirado. Redirigiendo al login...
                    </p>
                  </>
                ) : errorCode === 403 ? (
                  <>
                    <h2>Acceso Denegado</h2>
                    <p className={styles.errorMessage}>
                      No tienes permisos para acceder a esta información.
                    </p>
                    <Button
                      variant="filled"
                      color="primary"
                      onClick={() => navigate('/inicio')}
                      startIcon={<ArrowLeft size={16} />}
                    >
                      Volver al Inicio
                    </Button>
                  </>
                ) : (
                  <>
                    <h2>Error al cargar el historial</h2>
                    <p className={styles.errorMessage}>{error}</p>
                    <Button
                      variant="filled"
                      color="primary"
                      onClick={() => navigate('/inicio')}
                      startIcon={<ArrowLeft size={16} />}
                    >
                      Volver al Inicio
                    </Button>
                  </>
                )}
              </div>
            </Container>
          )}

          {!loading && !error && record && (
            <div className={styles.recordContainer}>
              {/* Aviso de Seguridad */}
              <AlertNote title="Este es tu historial clínico personal">
                Estos datos son confidenciales y están protegidos. Solo tú puedes acceder a tu historial clínico. Si necesitas actualizaciones, contacta a tu médico de cabecera.
              </AlertNote>

              {/* Información del Paciente */}
              <div className={styles.recordCard}>
                <div className={styles.cardHeader}>
                  <h2>Información Personal</h2>
                  <span className={styles.badge}>Modo Lectura</span>
                </div>

                <div className={styles.infoGrid}>
                  <div className={styles.infoField}>
                    <label>Paciente</label>
                    <div className={styles.fieldValue}>
                      <User size={16} />
                      <span>{user?.name || user?.email || 'Paciente'}</span>
                    </div>
                  </div>

                  <div className={styles.infoField}>
                    <label>Tipo de Sangre</label>
                    <div className={styles.fieldValue}>
                      <span className={styles.bloodType}>{record.tipoSangre}</span>
                    </div>
                  </div>

                  <div className={styles.infoField}>
                    <label>Última Actualización</label>
                    <div className={styles.fieldValue}>
                      <Calendar size={16} />
                      <span>
                        {new Date(record.ultimaModificacion).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información Médica */}
              <PersonalInfoSection
                tipoSangre={record.tipoSangre}
                alergias={record.alergias}
                condicionesCronicas={record.condicionesCronicas}
                medicamentosActuales={record.medicamentosActuales}
              />

              <ContactInfoSection
                medicoAsignado={record.medicoAsignado}
                contactoEmergencia={record.contactoEmergencia}
              />

              <ConsultasSection consultas={record.consultas} />

              <VacunasSection vacunas={record.vacunas} />

              <AntecedentesSection antecedentesFamiliares={record.antecedentesFamiliares} />

              <ProximaCitaSection
                proximaCita={record.proximaCita ? {
                  fecha: record.proximaCita.fecha,
                  motivo: record.proximaCita.motivo,
                  doctor: record.proximaCita.medico,
                } : null}
              />
            </div>
          )}

          {/* Sección de Citas Agendadas - siempre visible si hay citas */}
          {!loading && !error && appointments.length > 0 && (
            <div className={styles.recordCard}>
              <div className={styles.cardHeader}>
                <h2><Clock size={20} /> Mis Citas Agendadas</h2>
                <span className={styles.badge}>{appointments.length} cita{appointments.length !== 1 ? 's' : ''}</span>
              </div>
              <div className={styles.appointmentsList}>
                {appointments.map((apt) => (
                  <div key={apt.id} className={`${styles.appointmentItem} ${styles[`status${apt.estado.replace(' ', '')}`]}`}>
                    <div className={styles.appointmentDate}>
                      <Calendar size={16} />
                      <span>{new Date(apt.fecha).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                    <div className={styles.appointmentDetails}>
                      <strong>{apt.doctorName}</strong>
                      <span>{apt.motivo}</span>
                    </div>
                    <span className={`${styles.statusBadge} ${styles[`status${apt.estado.replace(' ', '')}`]}`}>
                      {apt.estado}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && !error && !record && appointments.length === 0 && (
            <div className={styles.emptyContainer}>
              <FileText size={48} className={styles.emptyIcon} />
              <h2>Sin Historial Clínico ni Citas</h2>
              <p>Aún no tienes registros clínicos ni citas agendadas. Contacta con tu centro médico para agendar una cita.</p>
            </div>
          )}

          {!loading && !error && !record && appointments.length > 0 && (
            <div className={styles.emptyContainer}>
              <FileText size={48} className={styles.emptyIcon} />
              <h2>Sin Historial Clínico</h2>
              <p>Aún no tienes registros clínicos, pero tienes citas agendadas. Tu historial se creará después de tu primera consulta.</p>
            </div>
          )}
        </div>
      </Container>
    </>
  );
};
