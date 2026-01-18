import React from 'react';
import { User, CreditCard, Mail, Phone, CalendarDays, MapPin, Building2, Globe, UserCircle, Heart, Briefcase, Droplet } from 'lucide-react';
import styles from './PatientFormSection.module.scss';
import { Input } from '../../atoms/Input/Input';
import { FilterSelect } from '../../atoms/FilterSelect/FilterSelect';
import { AlertNote } from '../../molecules/AlertNote/AlertNote';
import { type PatientFormData } from './SecretaryUserRegister.types';

interface PatientFormSectionProps {
  form: PatientFormData;
  onChange: (field: keyof PatientFormData) => (value: string) => void;
  iconColor: string;
}

export const PatientFormSection: React.FC<PatientFormSectionProps> = ({ form, onChange, iconColor }) => (
  <>
    {/* Sección: Información Personal */}
    <div className={styles.sectionTitle}>Información Personal</div>
    
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
        isRequired
        requiredColor={iconColor}
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
        isRequired
        requiredColor={iconColor}
      />
    </div>

    {/* Fila 2: Cédula y Email */}
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
        isRequired
        requiredColor={iconColor}
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
        isRequired
        requiredColor={iconColor}
      />
    </div>

    {/* Fila 3: Teléfono y Fecha de Nacimiento */}
    <div className={`${styles.formGroup} ${styles.phone}`}>
      <Input
        id="patient-telefonoContacto"
        label="Teléfono de Contacto"
        type="tel"
        value={form.telefonoContacto}
        onChange={onChange('telefonoContacto')}
        placeholder="+506 8888 8888"
        icon={<Phone size={16} style={{ color: iconColor }} />}
        focusColor={iconColor}
        isRequired
        requiredColor={iconColor}
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
        isRequired
        requiredColor={iconColor}
      />
    </div>

    {/* Sección: Datos Demográficos */}
    <div className={styles.sectionTitle}>Datos Demográficos</div>

    {/* Fila 4: Género y Estado Civil */}
    <div className={`${styles.formGroup} ${styles.genero}`}>
      <label className={styles.label}>
        <UserCircle size={16} style={{ color: iconColor }} />
        <span>Género</span>
      </label>
      <FilterSelect
        id="patient-genero"
        value={form.genero || ''}
        onChange={onChange('genero')}
        placeholder="Seleccione..."
        themeColor={iconColor}
        options={[
          { value: 'Masculino', label: 'Masculino' },
          { value: 'Femenino', label: 'Femenino' },
          { value: 'Otro', label: 'Otro' },
          { value: 'Prefiero no decir', label: 'Prefiero no decir' },
        ]}
      />
    </div>

    <div className={`${styles.formGroup} ${styles.estadoCivil}`}>
      <label className={styles.label}>
        <Heart size={16} style={{ color: iconColor }} />
        <span>Estado Civil</span>
      </label>
      <FilterSelect
        id="patient-estadoCivil"
        value={form.estadoCivil || ''}
        onChange={onChange('estadoCivil')}
        placeholder="Seleccione..."
        themeColor={iconColor}
        options={[
          { value: 'Soltero', label: 'Soltero/a' },
          { value: 'Casado', label: 'Casado/a' },
          { value: 'Divorciado', label: 'Divorciado/a' },
          { value: 'Viudo', label: 'Viudo/a' },
          { value: 'Unión Libre', label: 'Unión Libre' },
        ]}
      />
    </div>

    {/* Fila 5: Dirección */}
    <div className={`${styles.formGroup} ${styles.direccion}`}>
      <Input
        id="patient-direccion"
        label="Dirección"
        type="text"
        value={form.direccion || ''}
        onChange={onChange('direccion')}
        placeholder="Calle 123, Barrio ABC"
        icon={<MapPin size={16} style={{ color: iconColor }} />}
        focusColor={iconColor}
      />
    </div>

    {/* Fila 6: Ciudad y País */}
    <div className={`${styles.formGroup} ${styles.ciudad}`}>
      <Input
        id="patient-ciudad"
        label="Ciudad"
        type="text"
        value={form.ciudad || ''}
        onChange={onChange('ciudad')}
        placeholder="San José"
        icon={<Building2 size={16} style={{ color: iconColor }} />}
        focusColor={iconColor}
      />
    </div>

    <div className={`${styles.formGroup} ${styles.pais}`}>
      <Input
        id="patient-pais"
        label="País"
        type="text"
        value={form.pais || 'Costa Rica'}
        onChange={onChange('pais')}
        placeholder="Costa Rica"
        icon={<Globe size={16} style={{ color: iconColor }} />}
        focusColor={iconColor}
      />
    </div>

    {/* Fila 7: Ocupación y Grupo Sanguíneo */}
    <div className={`${styles.formGroup} ${styles.ocupacion}`}>
      <Input
        id="patient-ocupacion"
        label="Ocupación"
        type="text"
        value={form.ocupacion || ''}
        onChange={onChange('ocupacion')}
        placeholder="Ej: Ingeniero, Profesor, etc."
        icon={<Briefcase size={16} style={{ color: iconColor }} />}
        focusColor={iconColor}
      />
    </div>

    <div className={`${styles.formGroup} ${styles.grupoSanguineo}`}>
      <label className={styles.label}>
        <Droplet size={16} style={{ color: iconColor }} />
        <span>Grupo Sanguíneo</span>
      </label>
      <FilterSelect
        id="patient-grupoSanguineo"
        value={form.grupoSanguineo || ''}
        onChange={onChange('grupoSanguineo')}
        placeholder="Seleccione..."
        themeColor={iconColor}
        options={[
          { value: 'A+', label: 'A+' },
          { value: 'A-', label: 'A-' },
          { value: 'B+', label: 'B+' },
          { value: 'B-', label: 'B-' },
          { value: 'AB+', label: 'AB+' },
          { value: 'AB-', label: 'AB-' },
          { value: 'O+', label: 'O+' },
          { value: 'O-', label: 'O-' },
        ]}
      />
    </div>

    {/* Nota informativa */}
    <div style={{ gridColumn: '1 / -1' }}>
      <AlertNote
        title="Nota"
        color="secondary"
      >
        Se generará una contraseña temporal que será enviada al correo electrónico del paciente. Se recomienda cambiarla en el primer inicio de sesión.
      </AlertNote>
    </div>
  </>
);
