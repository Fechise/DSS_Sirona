import React, { useState } from 'react';
import styles from './SecretaryUserRegisterPage.module.scss';
import { Container } from '../../atoms/Container/Container';
import { UserPlus, Loader2 } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { UserTypeSelector } from '../../molecules/UserTypeSelector/UserTypeSelector';
import { PageHeader } from '../../molecules/PageHeader/PageHeader';
import { useAuth } from '../../../contexts/AuthContext';
import { AuthApiService } from '../../../services/api';
import { DoctorFormSection } from './DoctorFormSection';
import { PatientFormSection } from './PatientFormSection';
import { type DoctorFormData, type PatientFormData, type UserType } from './SecretaryUserRegister.types';

export const SecretaryUserRegisterPage: React.FC = () => {
  const { token } = useAuth();
  const [userType, setUserType] = useState<UserType>('patient');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Doctor form
  const [doctorForm, setDoctorForm] = useState<DoctorFormData>({
    firstName: '',
    lastName: '',
    email: '',
    cedula: '',
    especialidad: '',
    numeroLicencia: '',
  });

  // Patient form
  const [patientForm, setPatientForm] = useState<PatientFormData>({
    firstName: '',
    lastName: '',
    email: '',
    cedula: '',
    fechaNacimiento: '',
    telefonoContacto: '',
    direccion: '',
    ciudad: '',
    pais: 'Costa Rica',
    genero: '',
    estadoCivil: '',
    ocupacion: '',
    grupoSanguineo: '',
  });

  const handleDoctorChange = (field: keyof DoctorFormData) => (
    value: string
  ) => {
    setDoctorForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handlePatientChange = (field: keyof PatientFormData) => (
    value: string
  ) => {
    setPatientForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const resetForms = () => {
    setDoctorForm({
      firstName: '',
      lastName: '',
      email: '',
      cedula: '',
      especialidad: '',
      numeroLicencia: '',
    });
    setPatientForm({
      firstName: '',
      lastName: '',
      email: '',
      cedula: '',
      fechaNacimiento: '',
      telefonoContacto: '',
      direccion: '',
      ciudad: '',
      pais: 'Costa Rica',
      genero: '',
      estadoCivil: '',
      ocupacion: '',
      grupoSanguineo: '',
    });
  };

  const validateForm = (): boolean => {
    if (userType === 'doctor') {
      const { firstName, lastName, email, cedula, especialidad, numeroLicencia } = doctorForm;
      if (!firstName.trim()) {
        setError('El nombre es requerido');
        return false;
      }
      if (!lastName.trim()) {
        setError('El apellido es requerido');
        return false;
      }
      if (!email.trim()) {
        setError('El correo electrónico es requerido');
        return false;
      }
      if (!cedula.trim()) {
        setError('La cédula es requerida');
        return false;
      }
      if (!especialidad.trim()) {
        setError('La especialidad es requerida');
        return false;
      }
      if (!numeroLicencia.trim()) {
        setError('El número de licencia es requerido');
        return false;
      }
    } else {
      const { firstName, lastName, email, cedula, fechaNacimiento } = patientForm;
      if (!firstName.trim()) {
        setError('El nombre es requerido');
        return false;
      }
      if (!lastName.trim()) {
        setError('El apellido es requerido');
        return false;
      }
      if (!email.trim()) {
        setError('El correo electrónico es requerido');
        return false;
      }
      if (!cedula.trim()) {
        setError('La cédula es requerida');
        return false;
      }
      if (!fechaNacimiento.trim()) {
        setError('La fecha de nacimiento es requerida');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (userType === 'doctor') {
        const { firstName, lastName, ...rest } = doctorForm;
        await AuthApiService.registerDoctor(token, {
          ...rest,
          fullName: `${firstName} ${lastName}`.trim(),
        });
        setSuccess('Médico registrado exitosamente');
      } else {
        const { firstName, lastName, ...rest } = patientForm;
        await AuthApiService.registerPatient(token, {
          ...rest,
          fullName: `${firstName} ${lastName}`.trim(),
        });
        setSuccess('Paciente registrado exitosamente');
      }
      resetForms();
    } catch (err: any) {
      const errorMessage = err?.detail?.error || err?.detail || err?.message || 'Error al registrar usuario';
      setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  const formThemeClass = userType === 'doctor' ? styles.doctorTheme : styles.patientTheme;
  const roleColor = userType === 'doctor' ? 'primary' : 'secondary';
  const iconColor = userType === 'doctor' ? 'var(--role-doctor-color)' : 'var(--role-patient-color)';

  return (
    <Container>
      <main className={styles.main}>
        <PageHeader
          title="Registrar Usuario"
          subtitle="Crea nuevas cuentas de médicos o pacientes"
          icon={<UserPlus size={32} />}
        />

        {/* Selector de tipo de usuario */}
        <div className={styles.selectorWrapper}>
          <UserTypeSelector 
            value={userType} 
            onChange={setUserType}
          />
        </div>

        {/* Mensajes */}
        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}

        {/* Formulario */}
        <div className={`${styles.formShell} ${formThemeClass}`}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              {userType === 'doctor' ? (
                <DoctorFormSection
                  form={doctorForm}
                  onChange={handleDoctorChange}
                  iconColor={iconColor}
                />
              ) : (
                <PatientFormSection
                  form={patientForm}
                  onChange={handlePatientChange}
                  iconColor={iconColor}
                />
              )}
            </div>

            <Button
              type="submit"
              variant="filled"
              color={roleColor}
              disabled={loading}
              startIcon={loading ? <Loader2 size={16} className={styles.spinner} /> : <UserPlus size={16} />}
            >
              {loading ? 'Registrando...' : `Registrar ${userType === 'doctor' ? 'Médico' : 'Paciente'}`}
            </Button>
          </form>
        </div>
      </main>
    </Container>
  );
};
