import React, { useState, useEffect } from 'react';
import styles from './PatientHistoryPage.module.scss';
import { Container } from '../../atoms/Container/Container';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import {
  ArrowLeft,
  AlertCircle,
  FileText,
  User,
  Calendar,
} from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { LoadingSpinner } from '../../atoms/LoadingSpinner/LoadingSpinner';
import {
  PersonalInfoSection,
  DemographicInfoSection,
  ContactInfoSection,
  ConsultasSection,
  VacunasSection,
  AntecedentesSection,
} from '../../organisms/SectionsPatientHistory';
import { AlertNote } from '../../molecules/AlertNote/AlertNote';
import { PageHeader } from '../../molecules/PageHeader/PageHeader';
import { PatientApiService } from '../../../services/api';

type MedicalRecord = {
  id: string;
  // Datos demográficos
  direccion: string | null;
  ciudad: string | null;
  pais: string | null;
  genero: string | null;
  estadoCivil: string | null;
  ocupacion: string | null;
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
  
  ultimaModificacion: string;
};

export const PatientHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<MedicalRecord | null>(null);
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
        const data = await PatientApiService.getMyHistory(token);
        
        // Mapear respuesta del backend al formato esperado
        const mappedRecord: MedicalRecord = {
          id: data.id,
          // Datos demográficos
          direccion: data.direccion || null,
          ciudad: data.ciudad || null,
          pais: data.pais || null,
          genero: data.genero || null,
          estadoCivil: data.estadoCivil || null,
          ocupacion: data.ocupacion || null,
          // Información médica
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
          ultimaModificacion: data.ultimaModificacion
        };
        
        setRecord(mappedRecord);
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

              {/* Datos Demográficos */}
              <DemographicInfoSection
                direccion={record.direccion}
                ciudad={record.ciudad}
                pais={record.pais}
                genero={record.genero}
                estadoCivil={record.estadoCivil}
                ocupacion={record.ocupacion}
              />

              <ContactInfoSection
                medicoAsignado={record.medicoAsignado}
                contactoEmergencia={record.contactoEmergencia}
              />

              <ConsultasSection consultas={record.consultas} />

              <VacunasSection vacunas={record.vacunas} />

              <AntecedentesSection antecedentesFamiliares={record.antecedentesFamiliares} />
            </div>
          )}

          {!loading && !error && !record && (
            <div className={styles.emptyContainer}>
              <FileText size={48} className={styles.emptyIcon} />
              <h2>Sin Historial Clínico</h2>
              <p>Aún no tienes registros clínicos. Tu historial se creará después de tu primera consulta médica.</p>
            </div>
          )}
        </div>
      </Container>
    </>
  );
};
