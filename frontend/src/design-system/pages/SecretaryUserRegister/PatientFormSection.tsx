import React from 'react';
import { User, CreditCard, Mail, Phone, CalendarDays, FileBadge2 } from 'lucide-react';
import styles from './PatientFormSection.module.scss';
import { Input } from '../../atoms/Input/Input';
import { PasswordStrengthIndicator } from '../../molecules/PasswordStrengthIndicator/PasswordStrengthIndicator';
import { type PatientFormData } from './SecretaryUserRegister.types';

interface PatientFormSectionProps {
  form: PatientFormData;
  onChange: (field: keyof PatientFormData) => (value: string) => void;
  iconColor: string;
}

export const PatientFormSection: React.FC<PatientFormSectionProps> = ({ form, onChange, iconColor }) => (
  <>
    {/* Fila 1: Nombres y Apellidos */}
    <div className={`${styles.formGroup} ${styles.firstName}`}>
      <Input
        id="patient-firstName"
        label="Nombres"
        type="text"
        value={form.firstName}
        onChange={onChange('firstName')}
        placeholder="María Luisa"
        icon={<User size={16} style={{ color: iconColor }} />}
        focusColor={iconColor}
      />
    </div>

    <div className={`${styles.formGroup} ${styles.lastName}`}>
      <Input
        id="patient-lastName"
        label="Apellidos"
        type="text"
        value={form.lastName}
        onChange={onChange('lastName')}
        placeholder="González López"
        icon={<User size={16} style={{ color: iconColor }} />}
        focusColor={iconColor}
      />
    </div>

    {/* Fila 2: Cédula, Email, Teléfono, Fecha */}
    <div className={`${styles.formGroup} ${styles.cedula}`}>
      <Input
        id="patient-cedula"
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
        id="patient-email"
        label="Correo Electrónico"
        type="email"
        value={form.email}
        onChange={onChange('email')}
        placeholder="paciente@email.com"
        icon={<Mail size={16} style={{ color: iconColor }} />}
        focusColor={iconColor}
      />
    </div>

    <div className={`${styles.formGroup} ${styles.phone}`}>
      <Input
        id="patient-telefonoContacto"
        label="Teléfono de Contacto"
        type="tel"
        value={form.telefonoContacto}
        onChange={onChange('telefonoContacto')}
        placeholder="+57 300 123 4567"
        icon={<Phone size={16} style={{ color: iconColor }} />}
        focusColor={iconColor}
      />
    </div>

    <div className={`${styles.formGroup} ${styles.fecha}`}>
      <Input
        id="patient-fechaNacimiento"
        label="Fecha de Nacimiento"
        type="date"
        value={form.fechaNacimiento}
        onChange={onChange('fechaNacimiento')}
        icon={<CalendarDays size={16} style={{ color: iconColor }} />}
        focusColor={iconColor}
      />
    </div>

    {/* Fila 3: Contraseña centrada */}
    <div className={`${styles.formGroup} ${styles.password}`}>
      <Input
        id="patient-password"
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
