import React from 'react';
import { User, CreditCard, Mail, ShieldCheck, Stethoscope, FileBadge2 } from 'lucide-react';
import styles from './DoctorFormSection.module.scss';
import { Input } from '../../atoms/Input/Input';
import { PasswordStrengthIndicator } from '../../molecules/PasswordStrengthIndicator/PasswordStrengthIndicator';
import { type DoctorFormData } from './SecretaryUserRegister.types';

interface DoctorFormSectionProps {
  form: DoctorFormData;
  onChange: (field: keyof DoctorFormData) => (value: string) => void;
  iconColor: string;
}

export const DoctorFormSection: React.FC<DoctorFormSectionProps> = ({ form, onChange, iconColor }) => (
  <>
    {/* Fila 1: Nombres y Apellidos */}
    <div className={`${styles.formGroup} ${styles.firstName}`}>
      <Input
        id="doctor-firstName"
        label="Nombres"
        type="text"
        value={form.firstName}
        onChange={onChange('firstName')}
        placeholder="Juan Ramón"
        icon={<User size={16} style={{ color: iconColor }} />}
        focusColor={iconColor}
      />
    </div>

    <div className={`${styles.formGroup} ${styles.lastName}`}>
      <Input
        id="doctor-lastName"
        label="Apellidos"
        type="text"
        value={form.lastName}
        onChange={onChange('lastName')}
        placeholder="Pérez Gómez"
        icon={<User size={16} style={{ color: iconColor }} />}
        focusColor={iconColor}
      />
    </div>

    {/* Fila 2: Cédula, Email, Licencia, Especialidad */}
    <div className={`${styles.formGroup} ${styles.cedula}`}>
      <Input
        id="doctor-cedula"
        label="Cédula"
        type="text"
        value={form.cedula}
        onChange={onChange('cedula')}
        placeholder="1234567890"
        icon={<CreditCard size={16} style={{ color: iconColor }} />}
        focusColor={iconColor}
      />
    </div>

    <div className={`${styles.formGroup} ${styles.email}`}>
      <Input
        id="doctor-email"
        label="Correo Electrónico"
        type="email"
        value={form.email}
        onChange={onChange('email')}
        placeholder="doctor@sirona.com"
        icon={<Mail size={16} style={{ color: iconColor }} />}
        focusColor={iconColor}
      />
    </div>

    <div className={`${styles.formGroup} ${styles.licencia}`}>
      <Input
        id="doctor-numeroLicencia"
        label="Número de Licencia"
        type="text"
        value={form.numeroLicencia}
        onChange={onChange('numeroLicencia')}
        placeholder="MED-12345"
        icon={<ShieldCheck size={16} style={{ color: iconColor }} />}
        focusColor={iconColor}
      />
    </div>

    <div className={`${styles.formGroup} ${styles.especialidad}`}>
      <Input
        id="doctor-especialidad"
        label="Especialidad"
        type="text"
        value={form.especialidad}
        onChange={onChange('especialidad')}
        placeholder="Medicina General"
        icon={<Stethoscope size={16} style={{ color: iconColor }} />}
        focusColor={iconColor}
      />
    </div>

    {/* Fila 3: Contraseña centrada */}
    <div className={`${styles.formGroup} ${styles.password}`}>
      <Input
        id="doctor-password"
        label="Contraseña"
        type="password"
        value={form.password}
        onChange={onChange('password')}
        placeholder="Mínimo 12 caracteres"
        icon={<FileBadge2 size={16} style={{ color: iconColor }} />}
        focusColor={iconColor}
      />
      <PasswordStrengthIndicator password={form.password} />
    </div>
  </>
);
