import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, FileText, Plus, Save } from 'lucide-react';

import { useAuth } from '../../../contexts/AuthContext';
import { DoctorApiService, type PatientHistoryResponse } from '../../../services/api';
import { Button } from '../../atoms/Button/Button';
import { Container } from '../../atoms/Container/Container';
import { Input } from '../../atoms/Input/Input';
import { PageHeader } from '../../molecules/PageHeader/PageHeader';
import styles from './PatientRecordPage.module.scss';

/**
 * PBI-14 Security Policy: Clinical Data Storage
 * 
 * CRITICAL: This component does NOT store any patient clinical data in:
 * - localStorage
 * - sessionStorage
 * - browser cache
 * - cookies
 * 
 * All clinical data is:
 * 1. Fetched fresh from API on every navigation
 * 2. Stored only in React component state (memory)
 * 3. Cleared immediately when patientId changes
 * 4. Destroyed on component unmount
 * 
 * Only authentication tokens are persisted (managed by AuthContext).
 */

type ConsultationForm = {
  motivo: string;
  diagnostico: string;
  tratamiento: string;
  notasMedico: string;
};

type HistoryUpdateForm = {
  alergias: string;
  condicionesCronicas: string;
  medicamentosActuales: string;
  antecedentesFamiliares: string;
};

export const PatientRecordPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [history, setHistory] = useState<PatientHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [creating, setCreating] = useState(false);

  // Edit mode states
  const [editingHistory, setEditingHistory] = useState(false);
  const [historyForm, setHistoryForm] = useState<HistoryUpdateForm>({
    alergias: '',
    condicionesCronicas: '',
    medicamentosActuales: '',
    antecedentesFamiliares: '',
  });

  // New consultation form
  const [showConsultationForm, setShowConsultationForm] = useState(false);
  const [consultationForm, setConsultationForm] = useState<ConsultationForm>({
    motivo: '',
    diagnostico: '',
    tratamiento: '',
    notasMedico: '',
  });
  const [savingConsultation, setSavingConsultation] = useState(false);
  const [savingHistory, setSavingHistory] = useState(false);

  const loadHistory = async () => {
    if (!token || !patientId) return;

    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const data = await DoctorApiService.getPatientHistory(token, patientId);
      setHistory(data);
      setHistoryForm({
        alergias: data.alergias.join('\n'),
        condicionesCronicas: data.condicionesCronicas.join('\n'),
        medicamentosActuales: data.medicamentosActuales.join('\n'),
        antecedentesFamiliares: data.antecedentesFamiliares.join('\n'),
      });
    } catch (err: unknown) {
      const apiError = err as { status?: number };
      if (apiError.status === 404) {
        setNotFound(true);
      } else {
        setError('Error al cargar el historial médico');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    // Cleanup on unmount
    return () => {
      setHistory(null);
      setHistoryForm({ alergias: '', condicionesCronicas: '', medicamentosActuales: '', antecedentesFamiliares: '' });
    };
  }, [patientId, token]);

  const handleCreateHistory = async () => {
    if (!token || !patientId) return;

    setCreating(true);
    setError(null);

    try {
      const newHistory = await DoctorApiService.createPatientHistory(token, patientId);
      setHistory(newHistory);
      setHistoryForm({
        alergias: newHistory.alergias.join('\n'),
        condicionesCronicas: newHistory.condicionesCronicas.join('\n'),
        medicamentosActuales: newHistory.medicamentosActuales.join('\n'),
        antecedentesFamiliares: newHistory.antecedentesFamiliares.join('\n'),
      });
      setNotFound(false);
    } catch {
      setError('Error al crear el historial médico');
    } finally {
      setCreating(false);
    }
  };

  const handleSaveHistory = async () => {
    if (!token || !patientId) return;

    setSavingHistory(true);
    setError(null);

    try {
      const updated = await DoctorApiService.updatePatientHistory(token, patientId, {
        alergias: historyForm.alergias.split('\n').filter(Boolean),
        condicionesCronicas: historyForm.condicionesCronicas.split('\n').filter(Boolean),
        medicamentosActuales: historyForm.medicamentosActuales.split('\n').filter(Boolean),
        antecedentesFamiliares: historyForm.antecedentesFamiliares.split('\n').filter(Boolean),
      });
      setHistory(updated);
      setEditingHistory(false);
    } catch {
      setError('Error al guardar los cambios');
    } finally {
      setSavingHistory(false);
    }
  };

  const handleAddConsultation = async () => {
    if (!token || !patientId) return;

    if (!consultationForm.motivo || !consultationForm.diagnostico) {
      setError('El motivo y diagnóstico son obligatorios');
      return;
    }

    setSavingConsultation(true);
    setError(null);

    try {
      await DoctorApiService.addConsultation(token, patientId, consultationForm);
      setConsultationForm({ motivo: '', diagnostico: '', tratamiento: '', notasMedico: '' });
      setShowConsultationForm(false);
      // Reload to get updated consultations
      await loadHistory();
    } catch {
      setError('Error al agregar la consulta');
    } finally {
      setSavingConsultation(false);
    }
  };

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <Container>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Cargando historial médico...</p>
        </div>
      </Container>
    );
  }

  if (notFound) {
    return (
      <Container>
        <div className={styles.page}>
          <div className={styles.backButton}>
            <Button variant="filled" color="secondary" onClick={() => navigate('/medico/pacientes')} startIcon={<ArrowLeft size={16} />}>
              Volver
            </Button>
          </div>
          <div className={styles.emptyState}>
            <FileText size={48} className={styles.emptyIcon} />
            <h2>Sin Historial Médico</h2>
            <p>Este paciente aún no tiene un historial médico registrado.</p>
            <Button 
              variant="filled" 
              color="primary" 
              onClick={handleCreateHistory} 
              disabled={creating}
              startIcon={<Plus size={16} />}
            >
              {creating ? 'Creando...' : 'Crear Historial Médico'}
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  if (!history) {
    return (
      <Container>
        <div className={styles.errorContainer}>
          <AlertCircle size={48} className={styles.errorIcon} />
          <h2>Error</h2>
          <p className={styles.errorMessage}>{error || 'No se pudo cargar el historial'}</p>
          <Button variant="filled" color="primary" onClick={() => navigate('/medico/pacientes')} startIcon={<ArrowLeft size={16} />}>
            Volver a Mis Pacientes
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className={styles.page}>
        <div className={styles.backButton}>
          <Button variant="filled" color="secondary" onClick={() => navigate('/medico/pacientes')} startIcon={<ArrowLeft size={16} />}>
            Volver
          </Button>
        </div>
        <PageHeader title="Historial Médico" icon={<FileText size={32} />} />

        {error && (
          <div className={styles.alert}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Información General */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3>Información General</h3>
          </div>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.label}>Tipo de Sangre</span>
              <span className={styles.value}>{history.tipoSangre}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Médico Asignado</span>
              <span className={styles.value}>{history.medicoAsignado.nombre}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Especialidad</span>
              <span className={styles.value}>{history.medicoAsignado.especialidad}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Última Modificación</span>
              <span className={styles.value}>{formatDate(history.ultimaModificacion.toString())}</span>
            </div>
          </div>
        </section>

        {/* Contacto de Emergencia */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3>Contacto de Emergencia</h3>
          </div>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.label}>Nombre</span>
              <span className={styles.value}>{history.contactoEmergencia.nombre}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Relación</span>
              <span className={styles.value}>{history.contactoEmergencia.relacion}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Teléfono</span>
              <span className={styles.value}>{history.contactoEmergencia.telefono}</span>
            </div>
          </div>
        </section>

        {/* Datos Médicos Editables */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3>Datos Médicos</h3>
            {!editingHistory ? (
              <Button variant="outlined" color="primary" onClick={() => setEditingHistory(true)}>
                Editar
              </Button>
            ) : (
              <div className={styles.editActions}>
                <Button variant="outlined" color="secondary" onClick={() => {
                  setEditingHistory(false);
                  setHistoryForm({
                    alergias: history.alergias.join('\n'),
                    condicionesCronicas: history.condicionesCronicas.join('\n'),
                    medicamentosActuales: history.medicamentosActuales.join('\n'),
                    antecedentesFamiliares: history.antecedentesFamiliares.join('\n'),
                  });
                }}>
                  Cancelar
                </Button>
                <Button 
                  variant="filled" 
                  color="primary" 
                  onClick={handleSaveHistory}
                  disabled={savingHistory}
                  startIcon={<Save size={14} />}
                >
                  {savingHistory ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            )}
          </div>

          {!editingHistory ? (
            <div className={styles.medicalData}>
              <div className={styles.dataBlock}>
                <h4>Alergias</h4>
                {history.alergias.length > 0 ? (
                  <ul>{history.alergias.map((a, i) => <li key={i}>{a}</li>)}</ul>
                ) : (
                  <p className={styles.noData}>Sin alergias registradas</p>
                )}
              </div>
              <div className={styles.dataBlock}>
                <h4>Condiciones Crónicas</h4>
                {history.condicionesCronicas.length > 0 ? (
                  <ul>{history.condicionesCronicas.map((c, i) => <li key={i}>{c}</li>)}</ul>
                ) : (
                  <p className={styles.noData}>Sin condiciones crónicas</p>
                )}
              </div>
              <div className={styles.dataBlock}>
                <h4>Medicamentos Actuales</h4>
                {history.medicamentosActuales.length > 0 ? (
                  <ul>{history.medicamentosActuales.map((m, i) => <li key={i}>{m}</li>)}</ul>
                ) : (
                  <p className={styles.noData}>Sin medicamentos registrados</p>
                )}
              </div>
              <div className={styles.dataBlock}>
                <h4>Antecedentes Familiares</h4>
                {history.antecedentesFamiliares.length > 0 ? (
                  <ul>{history.antecedentesFamiliares.map((a, i) => <li key={i}>{a}</li>)}</ul>
                ) : (
                  <p className={styles.noData}>Sin antecedentes registrados</p>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.editForm}>
              <div className={styles.formGroup}>
                <label>Alergias (una por línea)</label>
                <textarea
                  value={historyForm.alergias}
                  onChange={(e) => setHistoryForm({ ...historyForm, alergias: e.target.value })}
                  rows={3}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Condiciones Crónicas (una por línea)</label>
                <textarea
                  value={historyForm.condicionesCronicas}
                  onChange={(e) => setHistoryForm({ ...historyForm, condicionesCronicas: e.target.value })}
                  rows={3}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Medicamentos Actuales (uno por línea)</label>
                <textarea
                  value={historyForm.medicamentosActuales}
                  onChange={(e) => setHistoryForm({ ...historyForm, medicamentosActuales: e.target.value })}
                  rows={3}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Antecedentes Familiares (uno por línea)</label>
                <textarea
                  value={historyForm.antecedentesFamiliares}
                  onChange={(e) => setHistoryForm({ ...historyForm, antecedentesFamiliares: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}
        </section>

        {/* Vacunas */}
        {history.vacunas.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Vacunas</h3>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Vacuna</th>
                    <th>Fecha</th>
                    <th>Próxima Dosis</th>
                  </tr>
                </thead>
                <tbody>
                  {history.vacunas.map((v, i) => (
                    <tr key={i}>
                      <td>{v.nombre}</td>
                      <td>{formatDate(v.fecha.toString())}</td>
                      <td>{v.proximaDosis ? formatDate(v.proximaDosis.toString()) : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Consultas */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3>Historial de Consultas</h3>
            <Button 
              variant="filled" 
              color="primary" 
              onClick={() => setShowConsultationForm(true)}
              startIcon={<Plus size={14} />}
            >
              Nueva Consulta
            </Button>
          </div>

          {showConsultationForm && (
            <div className={styles.consultationForm}>
              <h4>Agregar Nueva Consulta</h4>
              <div className={styles.formGrid}>
                <Input
                  id="motivo"
                  label="Motivo de Consulta *"
                  value={consultationForm.motivo}
                  onChange={(e) => setConsultationForm({ ...consultationForm, motivo: e })}
                  placeholder="Ej: Control de presión arterial"
                />
                <Input
                  id="diagnostico"
                  label="Diagnóstico *"
                  value={consultationForm.diagnostico}
                  onChange={(e) => setConsultationForm({ ...consultationForm, diagnostico: e })}
                  placeholder="Ej: Hipertensión controlada"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Tratamiento</label>
                <textarea
                  value={consultationForm.tratamiento}
                  onChange={(e) => setConsultationForm({ ...consultationForm, tratamiento: e.target.value })}
                  placeholder="Indicaciones de tratamiento..."
                  rows={3}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Notas del Médico</label>
                <textarea
                  value={consultationForm.notasMedico}
                  onChange={(e) => setConsultationForm({ ...consultationForm, notasMedico: e.target.value })}
                  placeholder="Observaciones adicionales..."
                  rows={3}
                />
              </div>
              <div className={styles.formActions}>
                <Button variant="outlined" color="secondary" onClick={() => {
                  setShowConsultationForm(false);
                  setConsultationForm({ motivo: '', diagnostico: '', tratamiento: '', notasMedico: '' });
                }}>
                  Cancelar
                </Button>
                <Button 
                  variant="filled" 
                  color="primary" 
                  onClick={handleAddConsultation}
                  disabled={savingConsultation}
                >
                  {savingConsultation ? 'Guardando...' : 'Guardar Consulta'}
                </Button>
              </div>
            </div>
          )}

          {history.consultas.length > 0 ? (
            <div className={styles.consultationsList}>
              {history.consultas.map((consulta) => (
                <div key={consulta.id} className={styles.consultationCard}>
                  <div className={styles.consultationHeader}>
                    <span className={styles.consultationDate}>{formatDate(consulta.fecha.toString())}</span>
                  </div>
                  <div className={styles.consultationContent}>
                    <div className={styles.consultationField}>
                      <strong>Motivo:</strong> {consulta.motivo}
                    </div>
                    <div className={styles.consultationField}>
                      <strong>Diagnóstico:</strong> {consulta.diagnostico}
                    </div>
                    {consulta.tratamiento && (
                      <div className={styles.consultationField}>
                        <strong>Tratamiento:</strong> {consulta.tratamiento}
                      </div>
                    )}
                    {consulta.notasMedico && (
                      <div className={styles.consultationField}>
                        <strong>Notas:</strong> {consulta.notasMedico}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noData}>No hay consultas registradas</p>
          )}
        </section>

        {/* Próxima Cita */}
        {history.proximaCita && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Próxima Cita</h3>
            </div>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Fecha</span>
                <span className={styles.value}>{formatDate(history.proximaCita.fecha.toString())}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Motivo</span>
                <span className={styles.value}>{history.proximaCita.motivo}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Médico</span>
                <span className={styles.value}>{history.proximaCita.medico}</span>
              </div>
            </div>
          </section>
        )}
      </div>
    </Container>
  );
};