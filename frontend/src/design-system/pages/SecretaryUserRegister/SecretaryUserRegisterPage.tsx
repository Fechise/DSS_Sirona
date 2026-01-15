import React, { useState } from 'react';
import styles from './SecretaryUserRegisterPage.module.scss';
import { Container } from '../../atoms/Container/Container';
import { UserPlus, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { PageHeader } from '../../molecules/PageHeader/PageHeader';
import { useAuth } from '../../../contexts/AuthContext';
import { AuthApiService } from '../../../services/api';

type CreatableRole = 'Médico' | 'Paciente';
const CREATABLE_ROLES: CreatableRole[] = ['Médico', 'Paciente'];

interface CreateUserFormData {
  email: string;
  password: string;
  fullName: string;
  cedula: string;
  role: CreatableRole;
  // Campos específicos por rol
  especialidad: string;
  numeroLicencia: string;
  fechaNacimiento: string;
  telefonoContacto: string;
}

const initialFormData: CreateUserFormData = {
  email: '',
  password: '',
  fullName: '',
  cedula: '',
  role: 'Paciente',
  especialidad: '',
  numeroLicencia: '',
  fechaNacimiento: '',
  telefonoContacto: '',
};

export const SecretaryUserRegisterPage: React.FC = () => {
  const { token } = useAuth();
  const [formData, setFormData] = useState<CreateUserFormData>(initialFormData);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFormChange = (field: keyof CreateUserFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    // Validación básica
    if (!formData.email || !formData.password || !formData.fullName || !formData.cedula) {
      setError('Por favor complete todos los campos obligatorios');
      return;
    }

    // Validar campos específicos por rol
    if (formData.role === 'Médico' && (!formData.especialidad || !formData.numeroLicencia)) {
      setError('Para médicos, la especialidad y número de licencia son obligatorios');
      return;
    }

    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      if (formData.role === 'Médico') {
        await AuthApiService.registerDoctor(token, {
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          cedula: formData.cedula,
          especialidad: formData.especialidad,
          numeroLicencia: formData.numeroLicencia,
        });
      } else {
        await AuthApiService.registerPatient(token, {
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          cedula: formData.cedula,
          fechaNacimiento: formData.fechaNacimiento || undefined,
          telefonoContacto: formData.telefonoContacto || undefined,
        });
      }

      setSuccess(`${formData.role} "${formData.fullName}" registrado exitosamente`);
      resetForm();
    } catch (err: unknown) {
      console.error('Error creating user:', err);
      const errorObj = err as { detail?: string | { error?: string; message?: string; details?: string[] } };
      if (typeof errorObj.detail === 'string') {
        setError(errorObj.detail);
      } else if (typeof errorObj.detail === 'object') {
        if (errorObj.detail?.error) {
          setError(errorObj.detail.error);
        } else if (errorObj.detail?.message) {
          setError(errorObj.detail.message);
        } else if (errorObj.detail?.details) {
          setError(errorObj.detail.details.join(', '));
        } else {
          setError('Error al registrar el usuario');
        }
      } else {
        setError('Error al registrar el usuario');
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <Container>
      <main className={styles.main}>
        <PageHeader
          title="Registrar Usuario"
          icon={<UserPlus size={32} />}
        />

        <p className={styles.subtitle}>
          Registra nuevos médicos o pacientes en el sistema
        </p>

        {error && (
          <div className={styles.errorMessage}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {success && (
          <div className={styles.successMessage}>
            <CheckCircle size={18} />
            {success}
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formCard}>
            <h3 className={styles.sectionTitle}>Tipo de Usuario</h3>
            
            <div className={styles.roleSelector}>
              {CREATABLE_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`${styles.roleButton} ${formData.role === role ? styles.active : ''}`}
                  onClick={() => handleFormChange('role', role)}
                  disabled={creating}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.formCard}>
            <h3 className={styles.sectionTitle}>Información Personal</h3>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="fullName">Nombre Completo *</label>
                <input
                  id="fullName"
                  type="text"
                  className={styles.formInput}
                  value={formData.fullName}
                  onChange={(e) => handleFormChange('fullName', e.target.value)}
                  placeholder="Juan Pérez García"
                  disabled={creating}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="cedula">Cédula *</label>
                <input
                  id="cedula"
                  type="text"
                  className={styles.formInput}
                  value={formData.cedula}
                  onChange={(e) => handleFormChange('cedula', e.target.value)}
                  placeholder="12345678"
                  disabled={creating}
                  required
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="email">Correo Electrónico *</label>
                <input
                  id="email"
                  type="email"
                  className={styles.formInput}
                  value={formData.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  placeholder="usuario@ejemplo.com"
                  disabled={creating}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="password">Contraseña *</label>
                <input
                  id="password"
                  type="password"
                  className={styles.formInput}
                  value={formData.password}
                  onChange={(e) => handleFormChange('password', e.target.value)}
                  placeholder="Mínimo 12 caracteres, mayúscula, número, símbolo"
                  disabled={creating}
                  required
                />
              </div>
            </div>
          </div>

          {/* Campos específicos para Médico */}
          {formData.role === 'Médico' && (
            <div className={styles.formCard}>
              <h3 className={styles.sectionTitle}>Información Profesional</h3>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="especialidad">Especialidad *</label>
                  <input
                    id="especialidad"
                    type="text"
                    className={styles.formInput}
                    value={formData.especialidad}
                    onChange={(e) => handleFormChange('especialidad', e.target.value)}
                    placeholder="Cardiología, Pediatría, etc."
                    disabled={creating}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="numeroLicencia">Número de Licencia Médica *</label>
                  <input
                    id="numeroLicencia"
                    type="text"
                    className={styles.formInput}
                    value={formData.numeroLicencia}
                    onChange={(e) => handleFormChange('numeroLicencia', e.target.value)}
                    placeholder="MED-12345"
                    disabled={creating}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Campos específicos para Paciente */}
          {formData.role === 'Paciente' && (
            <div className={styles.formCard}>
              <h3 className={styles.sectionTitle}>Información Adicional</h3>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="fechaNacimiento">Fecha de Nacimiento</label>
                  <input
                    id="fechaNacimiento"
                    type="date"
                    className={styles.formInput}
                    value={formData.fechaNacimiento}
                    onChange={(e) => handleFormChange('fechaNacimiento', e.target.value)}
                    disabled={creating}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="telefonoContacto">Teléfono de Contacto</label>
                  <input
                    id="telefonoContacto"
                    type="tel"
                    className={styles.formInput}
                    value={formData.telefonoContacto}
                    onChange={(e) => handleFormChange('telefonoContacto', e.target.value)}
                    placeholder="+1 234 567 8900"
                    disabled={creating}
                  />
                </div>
              </div>
            </div>
          )}

          <div className={styles.formActions}>
            <Button
              type="button"
              variant="outlined"
              color="secondary"
              onClick={resetForm}
              disabled={creating}
            >
              Limpiar Formulario
            </Button>
            <Button
              type="submit"
              variant="filled"
              color="primary"
              disabled={creating}
              startIcon={creating ? <RefreshCw size={16} className={styles.spinner} /> : <UserPlus size={16} />}
            >
              {creating ? 'Registrando...' : `Registrar ${formData.role}`}
            </Button>
          </div>
        </form>
      </main>
    </Container>
  );
};
