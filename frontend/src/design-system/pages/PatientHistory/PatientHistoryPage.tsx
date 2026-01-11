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
  User
} from 'lucide-react';
import { Button } from '../../atoms/Button/Button';

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
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<number | null>(null);

  useEffect(() => {
    const loadPatientHistory = async () => {
      setLoading(true);
      setError(null);
      setErrorCode(null);
      try {
        // TODO: integrar con backend (GET /api/paciente/mi-historial)
        // const res = await fetch('/api/paciente/mi-historial', {
        //   headers: { 'Authorization': `Bearer ${token}` }
        // });
        // if (res.status === 401) {
        //   setErrorCode(401);
        //   setTimeout(() => navigate('/login'), 2000);
        //   return;
        // }
        // if (res.status === 403) {
        //   setErrorCode(403);
        //   return;
        // }
        // if (!res.ok) throw new Error('Failed to load history');
        // const data = await res.json();
        // setRecord(data);

        // Mock data: simular historial médico del paciente
        await new Promise((r) => setTimeout(r, 800));
        
        const mockData: MedicalRecord = {
          id: 'hist_001',
          tipoSangre: 'O+',
          alergias: ['Penicilina', 'Polen'],
          condicionesCronicas: ['Hipertensión arterial', 'Diabetes tipo 2 controlada'],
          medicamentosActuales: [
            'Losartán 50mg - Una vez al día',
            'Metformina 850mg - Dos veces al día',
            'Aspirina 100mg - Una vez al día'
          ],
          medicoAsignado: {
            nombre: 'Dr. Roberto García López',
            especialidad: 'Medicina Interna',
            telefono: '+34 912 345 678'
          },
          contactoEmergencia: {
            nombre: 'Pedro Martínez',
            relacion: 'Esposo',
            telefono: '+34 612 345 678'
          },
          consultas: [
            {
              id: 'cons_003',
              fecha: '2026-01-08',
              motivo: 'Control trimestral',
              diagnostico: 'Hipertensión arterial controlada',
              tratamiento: 'Continuar con medicación actual',
              notasMedico: 'Paciente muestra mejora significativa. Presión arterial estable. Se recomienda continuar con ejercicio regular y dieta baja en sodio.'
            },
            {
              id: 'cons_002',
              fecha: '2025-10-15',
              motivo: 'Consulta de seguimiento',
              diagnostico: 'Diabetes tipo 2 en control',
              tratamiento: 'Ajuste de dosis de Metformina',
              notasMedico: 'Niveles de glucosa en sangre dentro de rango objetivo. Se aumenta dosis de Metformina a 850mg dos veces al día.'
            },
            {
              id: 'cons_001',
              fecha: '2025-07-20',
              motivo: 'Consulta inicial',
              diagnostico: 'Hipertensión arterial leve, Prediabetes',
              tratamiento: 'Inicio de tratamiento farmacológico y cambios en estilo de vida',
              notasMedico: 'Primera consulta. Se inicia tratamiento con Losartán 50mg y Metformina 500mg. Se recomienda pérdida de peso y ejercicio regular.'
            }
          ],
          vacunas: [
            {
              nombre: 'COVID-19 (Refuerzo)',
              fecha: '2025-11-10'
            },
            {
              nombre: 'Influenza',
              fecha: '2025-10-05',
              proximaDosis: '2026-10-05'
            },
            {
              nombre: 'Tétanos',
              fecha: '2024-03-15',
              proximaDosis: '2034-03-15'
            }
          ],
          antecedentesFamiliares: [
            'Madre: Hipertensión arterial',
            'Padre: Diabetes tipo 2',
            'Hermano: Sin antecedentes relevantes'
          ],
          proximaCita: {
            fecha: '2026-04-08',
            motivo: 'Control trimestral de rutina',
            medico: 'Dr. Roberto García López'
          },
          ultimaModificacion: '2026-01-08T14:30:00Z'
        };
        
        setRecord(mockData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el historial');
        setErrorCode(500);
      } finally {
        setLoading(false);
      }
    };

    loadPatientHistory();
  }, [navigate]);

  return (
    <>
      <Container>
        <div className={styles.page}>
          <div className={styles.pageHeader}>
            <div className={styles.backButton}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => navigate('/inicio')}
                startIcon={<ArrowLeft size={16} />}
              >
                Volver
              </Button>
            </div>
            <div className={styles.titleSection}>
              <FileText size={32} className={styles.titleIcon} />
              <div>
                <h1 className={styles.title}>Mi Historial Clínico</h1>
                <p className={styles.subtitle}>Información médica personal y confidencial</p>
              </div>
            </div>
          </div>

          {loading && (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner} />
              <p>Cargando tu historial...</p>
            </div>
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
              <div className={styles.securityNotice}>
                <AlertCircle size={20} />
                <div>
                  <h3>Este es tu historial clínico personal</h3>
                  <p>
                    Estos datos son confidenciales y están protegidos. Solo tú puedes acceder a tu historial clínico.
                    Si necesitas actualizaciones, contacta a tu médico de cabecera.
                  </p>
                </div>
              </div>

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
              <div className={styles.recordCard}>
                <div className={styles.cardHeader}>
                  <h2>Información Médica</h2>
                </div>

                <div className={styles.fieldSection}>
                  <label>Alergias</label>
                  {record.alergias.length > 0 ? (
                    <div className={styles.tagList}>
                      {record.alergias.map((alergia, idx) => (
                        <span key={idx} className={styles.allergyTag}>{alergia}</span>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.readOnlyField}>Sin alergias registradas</p>
                  )}
                </div>

                <div className={styles.fieldSection}>
                  <label>Condiciones Crónicas</label>
                  {record.condicionesCronicas.length > 0 ? (
                    <div className={styles.tagList}>
                      {record.condicionesCronicas.map((condicion, idx) => (
                        <span key={idx} className={styles.conditionTag}>{condicion}</span>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.readOnlyField}>Sin condiciones crónicas</p>
                  )}
                </div>

                <div className={styles.fieldSection}>
                  <label>Medicamentos Actuales</label>
                  {record.medicamentosActuales.length > 0 ? (
                    <ul className={styles.medicationList}>
                      {record.medicamentosActuales.map((med, idx) => (
                        <li key={idx}>{med}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.readOnlyField}>Sin medicamentos actuales</p>
                  )}
                </div>
              </div>

              {/* Médico Asignado */}
              <div className={styles.recordCard}>
                <div className={styles.cardHeader}>
                  <h2>Médico Asignado</h2>
                </div>

                <div className={styles.infoGrid}>
                  <div className={styles.infoField}>
                    <label>Nombre</label>
                    <div className={styles.fieldValue}>
                      <span>{record.medicoAsignado.nombre}</span>
                    </div>
                  </div>

                  <div className={styles.infoField}>
                    <label>Especialidad</label>
                    <div className={styles.fieldValue}>
                      <span>{record.medicoAsignado.especialidad}</span>
                    </div>
                  </div>

                  <div className={styles.infoField}>
                    <label>Teléfono</label>
                    <div className={styles.fieldValue}>
                      <span>{record.medicoAsignado.telefono}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contacto de Emergencia */}
              <div className={styles.recordCard}>
                <div className={styles.cardHeader}>
                  <h2>Contacto de Emergencia</h2>
                </div>

                <div className={styles.infoGrid}>
                  <div className={styles.infoField}>
                    <label>Nombre</label>
                    <div className={styles.fieldValue}>
                      <span>{record.contactoEmergencia.nombre}</span>
                    </div>
                  </div>

                  <div className={styles.infoField}>
                    <label>Relación</label>
                    <div className={styles.fieldValue}>
                      <span>{record.contactoEmergencia.relacion}</span>
                    </div>
                  </div>

                  <div className={styles.infoField}>
                    <label>Teléfono</label>
                    <div className={styles.fieldValue}>
                      <span>{record.contactoEmergencia.telefono}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Historial de Consultas */}
              <div className={styles.recordCard}>
                <div className={styles.cardHeader}>
                  <h2>Historial de Consultas</h2>
                </div>

                {record.consultas.map((consulta, idx) => (
                  <div key={consulta.id} className={styles.consultaItem}>
                    <div className={styles.consultaHeader}>
                      <span className={styles.consultaFecha}>
                        {new Date(consulta.fecha).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                      <span className={styles.consultaMotivo}>{consulta.motivo}</span>
                    </div>
                    
                    <div className={styles.consultaDetails}>
                      <div className={styles.consultaField}>
                        <strong>Diagnóstico:</strong> {consulta.diagnostico}
                      </div>
                      <div className={styles.consultaField}>
                        <strong>Tratamiento:</strong> {consulta.tratamiento}
                      </div>
                      <div className={styles.consultaField}>
                        <strong>Notas del Médico:</strong> {consulta.notasMedico}
                      </div>
                    </div>
                    
                    {idx < record.consultas.length - 1 && <div className={styles.divider} />}
                  </div>
                ))}
              </div>

              {/* Vacunas */}
              <div className={styles.recordCard}>
                <div className={styles.cardHeader}>
                  <h2>Vacunas</h2>
                </div>

                <div className={styles.vaccineList}>
                  {record.vacunas.map((vacuna, idx) => (
                    <div key={idx} className={styles.vaccineItem}>
                      <div className={styles.vaccineName}>{vacuna.nombre}</div>
                      <div className={styles.vaccineDate}>
                        Aplicada: {new Date(vacuna.fecha).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      {vacuna.proximaDosis && (
                        <div className={styles.vaccineNext}>
                          Próxima dosis: {new Date(vacuna.proximaDosis).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Antecedentes Familiares */}
              <div className={styles.recordCard}>
                <div className={styles.cardHeader}>
                  <h2>Antecedentes Familiares</h2>
                </div>

                <ul className={styles.antecedentesList}>
                  {record.antecedentesFamiliares.map((antecedente, idx) => (
                    <li key={idx}>{antecedente}</li>
                  ))}
                </ul>
              </div>

              {/* Próxima Cita */}
              {record.proximaCita && (
                <div className={styles.recordCard}>
                  <div className={styles.cardHeader}>
                    <h2>Próxima Cita</h2>
                  </div>

                  <div className={styles.appointmentCard}>
                    <div className={styles.appointmentDate}>
                      <Calendar size={24} />
                      <div>
                        <div className={styles.appointmentDay}>
                          {new Date(record.proximaCita.fecha).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        <div className={styles.appointmentTime}>
                          {new Date(record.proximaCita.fecha).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    <div className={styles.appointmentInfo}>
                      <div><strong>Motivo:</strong> {record.proximaCita.motivo}</div>
                      <div><strong>Médico:</strong> {record.proximaCita.medico}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && !error && !record && (
            <div className={styles.emptyContainer}>
              <FileText size={48} className={styles.emptyIcon} />
              <h2>Sin Historial Clínico</h2>
              <p>Aún no tienes registros clínicos. Una vez que tu médico agregue información, aparecerá aquí.</p>
            </div>
          )}
        </div>
      </Container>
    </>
  );
};
