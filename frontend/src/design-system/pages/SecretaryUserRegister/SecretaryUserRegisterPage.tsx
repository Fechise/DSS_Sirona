import React, { useState } from 'react';
import styles from './SecretaryUserRegisterPage.module.scss';
import { Container } from '../../atoms/Container/Container';
import { UserPlus, Loader2 } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { Input } from '../../atoms/Input/Input';
import { PageHeader } from '../../molecules/PageHeader/PageHeader';
import { useAuth } from '../../../contexts/AuthContext';
import { AuthApiService } from '../../../services/api';
import { PasswordStrengthIndicator } from '../../molecules/PasswordStrengthIndicator/PasswordStrengthIndicator';

type UserType = 'doctor' | 'patient';

interface DoctorFormData {
  email: string;
  password: string;
  fullName: string;
  cedula: string;
  especialidad: string;
  numeroLicencia: string;
}

interface PatientFormData {
  email: string;
  password: string;
  fullName: string;
  cedula: string;
  fechaNacimiento: string;
  telefonoContacto: string;
}

export const SecretaryUserRegisterPage: React.FC = () => {
  const { token } = useAuth();
  const [userType, setUserType] = useState<UserType>('patient');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Doctor form
  const [doctorForm, setDoctorForm] = useState<DoctorFormData>({
    email: '',
    password: '',
    fullName: '',
    cedula: '',
    especialidad: '',
    numeroLicencia: '',
  });

  // Patient form
  const [patientForm, setPatientForm] = useState<PatientFormData>({
    email: '',
    password: '',
    fullName: '',
    cedula: '',
    fechaNacimiento: '',
    telefonoContacto: '',
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
      email: '',
      password: '',
      fullName: '',
      cedula: '',
      especialidad: '',
      numeroLicencia: '',
    });
    setPatientForm({
      email: '',
      password: '',
      fullName: '',
      cedula: '',
      fechaNacimiento: '',
      telefonoContacto: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (userType === 'doctor') {
        await AuthApiService.registerDoctor(token, doctorForm);
        setSuccess('Médico registrado exitosamente');
      } else {
        await AuthApiService.registerPatient(token, patientForm);
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

  const currentPassword = userType === 'doctor' ? doctorForm.password : patientForm.password;

  return (
    <Container>
      <main className={styles.main}>
        <PageHeader
          title="Registrar Usuario"
          icon={<UserPlus size={32} />}
        />
        
        <PasswordStrengthIndicator password={currentPassword} />

        <p className={styles.subtitle}>
          Como secretario, puedes registrar nuevos médicos y pacientes en el sistema
        </p>

        {/* Selector de tipo de usuario */}
        <div className={styles.userTypeSelector}>
          <button
            type="button"
            className={`${styles.typeButton} ${userType === 'patient' ? styles.active : ''}`}
            onClick={() => setUserType('patient')}
          >
            Paciente
          </button>
          <button
            type="button"
            className={`${styles.typeButton} ${userType === 'doctor' ? styles.active : ''}`}
            onClick={() => setUserType('doctor')}
          >
            Médico
          </button>
        </div>

        {/* Mensajes */}
        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}

        {/* Formulario */}
        <form className={styles.form} onSubmit={handleSubmit}>
          {userType === 'doctor' ? (
            <>
              <div className={styles.formGroup}>
                <Input
                  id="doctor-fullName"
                  label="Nombre Completo"
                  type="text"
                  value={doctorForm.fullName}
                  onChange={handleDoctorChange('fullName')}
                  placeholder="Dr. Juan Pérez"
                />
              </div>
              <div className={styles.formGroup}>
                <Input
                  id="doctor-email"
                  label="Correo Electrónico"
                  type="email"
                  value={doctorForm.email}
                  onChange={handleDoctorChange('email')}
                  placeholder="doctor@sirona.com"
                />
              </div>
              <div className={styles.formGroup}>
                <Input
                  id="doctor-cedula"
                  label="Cédula"
                  type="text"
                  value={doctorForm.cedula}
                  onChange={handleDoctorChange('cedula')}
                  placeholder="1234567890"
                />
              </div>
              <div className={styles.formGroup}>
                <Input
                  id="doctor-especialidad"
                  label="Especialidad"
                  type="text"
                  value={doctorForm.especialidad}
                  onChange={handleDoctorChange('especialidad')}
                  placeholder="Medicina General"
                />
              </div>
              <div className={styles.formGroup}>
                <Input
                  id="doctor-numeroLicencia"
                  label="Número de Licencia"
                  type="text"
                  value={doctorForm.numeroLicencia}
                  onChange={handleDoctorChange('numeroLicencia')}
                  placeholder="MED-12345"
                />
              </div>
              <div className={styles.formGroup}>
                <Input
                  id="doctor-password"
                  label="Contraseña"
                  type="password"
                  value={doctorForm.password}
                  onChange={handleDoctorChange('password')}
                  placeholder="Mínimo 12 caracteres"
                />
                <PasswordStrengthIndicator password={doctorForm.password} />
              </div>
            </>
          ) : (
            <>
              <div className={styles.formGroup}>
                <Input
                  id="patient-fullName"
                  label="Nombre Completo"
                  type="text"
                  value={patientForm.fullName}
                  onChange={handlePatientChange('fullName')}
                  placeholder="María González"
                />
              </div>
              <div className={styles.formGroup}>
                <Input
                  id="patient-email"
                  label="Correo Electrónico"
                  type="email"
                  value={patientForm.email}
                  onChange={handlePatientChange('email')}
                  placeholder="paciente@email.com"
                />
              </div>
              <div className={styles.formGroup}>
                <Input
                  id="patient-cedula"
                  label="Cédula"
                  type="text"
                  value={patientForm.cedula}
                  onChange={handlePatientChange('cedula')}
                  placeholder="1234567890"
                />
              </div>
              <div className={styles.formGroup}>
                <Input
                  id="patient-fechaNacimiento"
                  label="Fecha de Nacimiento"
                  type="date"
                  value={patientForm.fechaNacimiento}
                  onChange={handlePatientChange('fechaNacimiento')}
                />
              </div>
              <div className={styles.formGroup}>
                <Input
                  id="patient-telefonoContacto"
                  label="Teléfono de Contacto"
                  type="tel"
                  value={patientForm.telefonoContacto}
                  onChange={handlePatientChange('telefonoContacto')}
                  placeholder="+57 300 123 4567"
                />
              </div>
              <div className={styles.formGroup}>
                <Input
                  id="patient-password"
                  label="Contraseña"
                  type="password"
                  value={patientForm.password}
                  onChange={handlePatientChange('password')}
                  placeholder="Mínimo 12 caracteres"
                />
                <PasswordStrengthIndicator password={patientForm.password} />
              </div>
            </>
          )}

          <Button
            type="submit"
            variant="filled"
            color="primary"
            disabled={loading}
            startIcon={loading ? <Loader2 size={16} className={styles.spinner} /> : <UserPlus size={16} />}
          >
            {loading ? 'Registrando...' : `Registrar ${userType === 'doctor' ? 'Médico' : 'Paciente'}`}
          </Button>
        </form>
      </main>
    </Container>
  );
};
