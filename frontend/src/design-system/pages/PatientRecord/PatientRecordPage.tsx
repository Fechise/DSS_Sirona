import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, FileText } from 'lucide-react';

import { Button } from '../../atoms/Button/Button';
import { Container } from '../../atoms/Container/Container';
import { ConsultationInfoSection } from './sections/ConsultationInfoSection';
import { MedicalHistorySection } from './sections/MedicalHistorySection';
import { MedicationsSection } from './sections/MedicationsSection';
import { SocialHistorySection } from './sections/SocialHistorySection';
import { FamilyHistorySection } from './sections/FamilyHistorySection';
import { SystemsReviewSection } from './sections/SystemsReviewSection';
import { PhysicalExamSection } from './sections/PhysicalExamSection';
import { LaboratorySection } from './sections/LaboratorySection';
import { ImagingSection } from './sections/ImagingSection';
import { EvaluationSection } from './sections/EvaluationSection';
import { FollowUpSection } from './sections/FollowUpSection';
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

type ClinicalRecord = {
  id: string;
  patientId: string;
  patientName: string;
  patientCedula: string;
  doctorId: string;
  doctorName: string;
  fecha: string;
  motivoConsulta: string;
  historiaEnfermedadActual: string;
  antecedentesPersonales: string[];
  antecedentesQuirurgicos: string[];
  medicamentos: string[];
  alergias: string[];
  historiaSocial: {
    tabaquismo: string;
    alcohol: string;
    ocupacion: string;
    actividadFisica: string;
  };
  antecedentesFamiliares: string[];
  revisionSistemas: { sistema: string; hallazgos: string }[];
  examenFisico: {
    signosVitales: {
      tensionArterial: string;
      frecuenciaCardiaca: string;
      temperatura: string;
      frecuenciaRespiratoria: string;
      saturacion: string;
    };
    hallazgos: {
      general: string;
      cardiovascular: string;
      respiratorio: string;
      abdomen: string;
      neurologico: string;
    };
  };
  laboratorios: { prueba: string; valor: string; unidad?: string; referencia?: string; fecha: string }[];
  imagenes: { estudio: string; fecha: string; impresion: string }[];
  diagnostico: string;
  tratamiento: string;
  observaciones: string;
  seguimiento?: { fecha: string; instrucciones: string };
  ultimaModificacion: string;
};

type EvalForm = Pick<ClinicalRecord, 'diagnostico' | 'tratamiento' | 'observaciones'>;
type InfoForm = Pick<ClinicalRecord, 'motivoConsulta' | 'historiaEnfermedadActual'>;
type AntecedentesForm = { personales: string; quirurgicos: string };
type MedsForm = { medicamentos: string; alergias: string };
type SocialForm = ClinicalRecord['historiaSocial'];

const buildMockRecord = (patientId?: string): ClinicalRecord => {
  const resolved = patientId || '1';
  const patientName =
    resolved === '1' ? 'Juan Pérez' : resolved === '2' ? 'María González' : resolved === '3' ? 'Carlos Ruiz' : 'Ana López';
  const patientCedula =
    resolved === '1' ? '1234567890' : resolved === '2' ? '0987654321' : resolved === '3' ? '1122334455' : '5566778899';

  return {
    id: 'rec-1',
    patientId: resolved,
    patientName,
    patientCedula,
    doctorId: 'doc-1',
    doctorName: 'Dr. Roberto García',
    fecha: '2026-01-08',
    motivoConsulta: 'Control de hipertensión y evaluación de síntomas recientes',
    historiaEnfermedadActual:
      'Paciente masculino de 52 años con antecedente de hipertensión arterial. Refiere cefaleas leves y mareos ocasionales desde hace 2 semanas. Niega dolor torácico, disnea o edema. Cumple tratamiento de forma regular. Dieta con moderación de sodio y ejercicio 3 veces por semana.',
    antecedentesPersonales: ['Hipertensión arterial (diagnóstico hace 6 años)', 'Prediabetes (control con dieta y ejercicio)', 'Hiperlipidemia leve'],
    antecedentesQuirurgicos: ['Apendicectomía en 2001'],
    medicamentos: ['Losartán 50 mg cada 12 horas', 'Atorvastatina 20 mg en la noche'],
    alergias: ['Penicilina'],
    historiaSocial: {
      tabaquismo: 'Exfumador, dejó hace 5 años (10 paquetes/año previos)',
      alcohol: 'Social, 1-2 unidades por semana',
      ocupacion: 'Contador público',
      actividadFisica: 'Camina 30 min, 3-4 veces por semana',
    },
    antecedentesFamiliares: ['Madre: Hipertensión arterial', 'Padre: Diabetes tipo 2'],
    revisionSistemas: [
      { sistema: 'Cardiovascular', hallazgos: 'Niega dolor torácico, palpitaciones o disnea.' },
      { sistema: 'Respiratorio', hallazgos: 'Niega tos, sibilancias o disnea de esfuerzo.' },
      { sistema: 'Neurológico', hallazgos: 'Cefaleas leves, sin focalidad neurológica.' },
    ],
    examenFisico: {
      signosVitales: {
        tensionArterial: '132/84 mmHg',
        frecuenciaCardiaca: '72 lpm',
        temperatura: '36.7 °C',
        frecuenciaRespiratoria: '16 rpm',
        saturacion: '98%',
      },
      hallazgos: {
        general: 'Buen estado general, consciente y orientado.',
        cardiovascular: 'Ritmo regular, sin soplos.',
        respiratorio: 'Murmullo vesicular conservado, sin ruidos agregados.',
        abdomen: 'Blando, depresible, no doloroso, sin masas.',
        neurologico: 'Sin déficit motor ni sensitivo aparente.',
      },
    },
    laboratorios: [
      { prueba: 'Glucosa', valor: '98', unidad: 'mg/dL', referencia: '70-99', fecha: '2025-12-20' },
      { prueba: 'Colesterol LDL', valor: '132', unidad: 'mg/dL', referencia: '<130', fecha: '2025-12-20' },
      { prueba: 'Creatinina', valor: '0.9', unidad: 'mg/dL', referencia: '0.7-1.3', fecha: '2025-12-20' },
    ],
    imagenes: [{ estudio: 'ECG', fecha: '2025-10-10', impresion: 'Ritmo sinusal, sin alteraciones significativas.' }],
    diagnostico: 'Hipertensión arterial controlada',
    tratamiento: 'Continuar Losartán 50 mg cada 12 horas. Mantener dieta baja en sodio y ejercicio moderado.',
    observaciones:
      'Se sugiere monitoreo domiciliario de la presión arterial 3 veces por semana y registro en app. Evaluar lípidos nuevamente en 3 meses. Educación sobre signos de alarma.',
    seguimiento: {
      fecha: '2026-02-08',
      instrucciones: 'Control en consulta externa, llevar registros de presión arterial y resultados de laboratorio si se realizan antes.',
    },
    ultimaModificacion: '2026-01-08T14:30:00Z',
  };
};

export const PatientRecordPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const [record, setRecord] = useState<ClinicalRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Per-section edit flags
  const [editInfo, setEditInfo] = useState(false);
  const [editAntecedentes, setEditAntecedentes] = useState(false);
  const [editMeds, setEditMeds] = useState(false);
  const [editSocial, setEditSocial] = useState(false);
  const [editEval, setEditEval] = useState(false);

  // Per-section forms
  const [infoForm, setInfoForm] = useState<InfoForm>({ motivoConsulta: '', historiaEnfermedadActual: '' });
  const [antecedentesForm, setAntecedentesForm] = useState<AntecedentesForm>({ personales: '', quirurgicos: '' });
  const [medsForm, setMedsForm] = useState<MedsForm>({ medicamentos: '', alergias: '' });
  const [socialForm, setSocialForm] = useState<SocialForm>({ tabaquismo: '', alcohol: '', ocupacion: '', actividadFisica: '' });
  const [evalForm, setEvalForm] = useState<EvalForm>({ diagnostico: '', tratamiento: '', observaciones: '' });

  useEffect(() => {
    // PBI-14: Race condition protection - only the latest request should update state
    let isCurrent = true;
    const abortController = new AbortController();

    // PBI-14: Clear all previous patient data immediately when patientId changes
    const clearAllPatientData = () => {
      setRecord(null);
      setInfoForm({ motivoConsulta: '', historiaEnfermedadActual: '' });
      setAntecedentesForm({ personales: '', quirurgicos: '' });
      setMedsForm({ medicamentos: '', alergias: '' });
      setSocialForm({ tabaquismo: '', alcohol: '', ocupacion: '', actividadFisica: '' });
      setEvalForm({ diagnostico: '', tratamiento: '', observaciones: '' });
      setEditInfo(false);
      setEditAntecedentes(false);
      setEditMeds(false);
      setEditSocial(false);
      setEditEval(false);
      setError(null);
      setAuthError(null);
    };

    const fetchRecord = async () => {
      // PBI-14: Clear previous patient data IMMEDIATELY before fetching new data
      // This ensures no data from Patient A is visible while loading Patient B
      clearAllPatientData();
      setLoading(true);

      try {
        // Simulate API call: GET /api/doctor/patients/:patientId/clinical-record
        // In production, pass abortController.signal to fetch options
        await new Promise((resolve) => setTimeout(resolve, 400));
        
        // PBI-14: Ignore response if this request is no longer current (race condition)
        if (!isCurrent || abortController.signal.aborted) return;

        const data = buildMockRecord(patientId);
        
        // PBI-14: Double-check isCurrent before updating state
        if (!isCurrent) return;

        setRecord(data);
        setInfoForm({ motivoConsulta: data.motivoConsulta, historiaEnfermedadActual: data.historiaEnfermedadActual });
        setAntecedentesForm({ personales: data.antecedentesPersonales.join('\n'), quirurgicos: data.antecedentesQuirurgicos.join('\n') });
        setMedsForm({ medicamentos: data.medicamentos.join('\n'), alergias: data.alergias.join('\n') });
        setSocialForm({ ...data.historiaSocial });
        setEvalForm({ diagnostico: data.diagnostico, tratamiento: data.tratamiento, observaciones: data.observaciones });
      } catch (err) {
        // PBI-14: Ignore errors from aborted/stale requests
        if (!isCurrent || abortController.signal.aborted) return;
        setError('Error al cargar el historial médico');
      } finally {
        // PBI-14: Only update loading state if this is still the current request
        if (isCurrent) setLoading(false);
      }
    };

    fetchRecord();

    return () => {
      // PBI-14: Mark this request as stale and abort any ongoing fetch
      isCurrent = false;
      abortController.abort();
      // PBI-14: Cleanup on unmount to prevent memory leaks and data exposure
      clearAllPatientData();
    };
  }, [patientId]);

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

  const saveSection = async (section: 'info' | 'antecedentes' | 'meds' | 'social' | 'eval') => {
    if (!record) return;
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const updated: ClinicalRecord = { ...record, ultimaModificacion: new Date().toISOString() };

      if (section === 'info') {
        updated.motivoConsulta = infoForm.motivoConsulta;
        updated.historiaEnfermedadActual = infoForm.historiaEnfermedadActual;
        setRecord(updated);
        setEditInfo(false);
        return;
      }
      if (section === 'antecedentes') {
        updated.antecedentesPersonales = antecedentesForm.personales.split('\n').filter(Boolean);
        updated.antecedentesQuirurgicos = antecedentesForm.quirurgicos.split('\n').filter(Boolean);
        setRecord(updated);
        setEditAntecedentes(false);
        return;
      }
      if (section === 'meds') {
        updated.medicamentos = medsForm.medicamentos.split('\n').filter(Boolean);
        updated.alergias = medsForm.alergias.split('\n').filter(Boolean);
        setRecord(updated);
        setEditMeds(false);
        return;
      }
      if (section === 'social') {
        updated.historiaSocial = { ...socialForm };
        setRecord(updated);
        setEditSocial(false);
        return;
      }
      if (section === 'eval') {
        updated.diagnostico = evalForm.diagnostico;
        updated.tratamiento = evalForm.tratamiento;
        updated.observaciones = evalForm.observaciones;
        setRecord(updated);
        setEditEval(false);
        return;
      }
    } catch (err) {
      setError('Error al guardar la sección');
    }
  };

  if (loading) {
    // PBI-14: During loading, NO patient data is rendered
    // This prevents Patient A's data from being visible while Patient B loads
    return (
      <Container>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Cargando historial médico...</p>
        </div>
      </Container>
    );
  }

  if (authError) {
    // PBI-14: Authorization error - no patient data is exposed
    return (
      <Container>
        <div className={styles.errorContainer}>
          <AlertCircle size={48} className={styles.errorIcon} />
          <h2>Acceso Denegado</h2>
          <p className={styles.errorMessage}>{authError}</p>
          <p className={styles.errorDetail}>No tienes permiso para ver el historial de este paciente. Solo puedes acceder a los historiales de tus pacientes asignados.</p>
          <Button variant="filled" color="primary" onClick={() => navigate('/medico/pacientes')} startIcon={<ArrowLeft size={16} />}>Volver a Mis Pacientes</Button>
        </div>
      </Container>
    );
  }

  if (!record) {
    // PBI-14: No record loaded - show error without exposing any patient data
    return (
      <Container>
        <div className={styles.errorContainer}>
          <AlertCircle size={48} className={styles.errorIcon} />
          <h2>Historial No Encontrado</h2>
          <p className={styles.errorMessage}>No se encontró el historial médico del paciente.</p>
          <Button variant="filled" color="primary" onClick={() => navigate('/medico/pacientes')} startIcon={<ArrowLeft size={16} />}>Volver a Mis Pacientes</Button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <Button variant="filled" color="secondary" onClick={() => navigate('/medico/pacientes')} startIcon={<ArrowLeft size={16} />}>Volver</Button>
          <h1 className={styles.title}><FileText size={28} />Historial Médico</h1>
        </div>

        {error && (
          <div className={styles.alert}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <ConsultationInfoSection
          motivoConsulta={record.motivoConsulta}
          historiaEnfermedadActual={record.historiaEnfermedadActual}
          isEditing={editInfo}
          formData={infoForm}
          onEdit={() => setEditInfo(true)}
          onCancel={() => {
            setInfoForm({ motivoConsulta: record.motivoConsulta, historiaEnfermedadActual: record.historiaEnfermedadActual });
            setEditInfo(false);
          }}
          onSave={() => saveSection('info')}
          onChange={(field, value) => setInfoForm({ ...infoForm, [field]: value })}
        />

        <MedicalHistorySection
          antecedentesPersonales={record.antecedentesPersonales}
          antecedentesQuirurgicos={record.antecedentesQuirurgicos}
          isEditing={editAntecedentes}
          formData={antecedentesForm}
          onEdit={() => setEditAntecedentes(true)}
          onCancel={() => {
            setAntecedentesForm({ personales: record.antecedentesPersonales.join('\n'), quirurgicos: record.antecedentesQuirurgicos.join('\n') });
            setEditAntecedentes(false);
          }}
          onSave={() => saveSection('antecedentes')}
          onChange={(field, value) => setAntecedentesForm({ ...antecedentesForm, [field]: value })}
        />

        <MedicationsSection
          medicamentos={record.medicamentos}
          alergias={record.alergias}
          isEditing={editMeds}
          formData={medsForm}
          onEdit={() => setEditMeds(true)}
          onCancel={() => {
            setMedsForm({ medicamentos: record.medicamentos.join('\n'), alergias: record.alergias.join('\n') });
            setEditMeds(false);
          }}
          onSave={() => saveSection('meds')}
          onChange={(field, value) => setMedsForm({ ...medsForm, [field]: value })}
        />

        <SocialHistorySection
          historiaSocial={record.historiaSocial}
          isEditing={editSocial}
          formData={socialForm}
          onEdit={() => setEditSocial(true)}
          onCancel={() => {
            setSocialForm({ ...record.historiaSocial });
            setEditSocial(false);
          }}
          onSave={() => saveSection('social')}
          onChange={(field, value) => setSocialForm({ ...socialForm, [field]: value })}
        />

        <FamilyHistorySection antecedentesFamiliares={record.antecedentesFamiliares} />

        <SystemsReviewSection revisionSistemas={record.revisionSistemas} />

        <PhysicalExamSection examenFisico={record.examenFisico} />

        <LaboratorySection laboratorios={record.laboratorios} />

        <ImagingSection imagenes={record.imagenes} />

        <EvaluationSection
          diagnostico={record.diagnostico}
          tratamiento={record.tratamiento}
          observaciones={record.observaciones}
          ultimaModificacion={record.ultimaModificacion}
          isEditing={editEval}
          formData={evalForm}
          onEdit={() => setEditEval(true)}
          onCancel={() => {
            setEvalForm({ diagnostico: record.diagnostico, tratamiento: record.tratamiento, observaciones: record.observaciones });
            setEditEval(false);
          }}
          onSave={() => saveSection('eval')}
          onChange={(field, value) => setEvalForm({ ...evalForm, [field]: value })}
          formatDate={formatDate}
        />

        <FollowUpSection seguimiento={record.seguimiento} formatDate={formatDate} />
      </div>
    </Container>
  );
};