import React, { useState } from 'react';
import styles from './RegisterForm.module.scss';
import { Input } from '../../atoms/Input/Input';
import { Button } from '../../atoms/Button/Button';
import { User, Mail, CreditCard, Lock, ShieldCheck } from 'lucide-react';
import { PasswordStrengthIndicator, validatePasswordStrength } from '../PasswordStrengthIndicator/PasswordStrengthIndicator';
import { CedulaUpload } from '../CedulaUpload/CedulaUpload';

export type RegisterData = {
  fullName: string;
  email: string;
  cedula: string;
  password: string;
  cedulaImage: File | null;
};

type Props = {
  onSubmit?: (data: RegisterData) => Promise<void> | void;
  loading?: boolean;
};

export const RegisterForm: React.FC<Props> = ({ onSubmit, loading = false }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cedulaImage, setCedulaImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    cedula?: string;
    password?: string;
    confirmPassword?: string;
    cedulaImage?: string;
  }>({});

  const passwordValidation = React.useMemo(() => validatePasswordStrength(password), [password]);

  const validate = () => {
    const next: typeof errors = {};
    if (!fullName.trim()) next.fullName = 'El nombre completo es obligatorio.';
    if (!email.trim()) next.email = 'El correo es obligatorio.';
    else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'El correo no es válido.';
    if (!cedula.trim()) next.cedula = 'La cédula es obligatoria.';
    if (!password) next.password = 'La contraseña es obligatoria.';
    if (!confirmPassword) next.confirmPassword = 'Repite la contraseña.';
    else if (confirmPassword !== password) next.confirmPassword = 'Las contraseñas no coinciden.';
    // Política FIA_SOS.1: mínimos de calidad
    if (!passwordValidation.valid) {
      next.password = `La contraseña no cumple: ${passwordValidation.unmet.join(', ')}`;
    }
    if (!cedulaImage) next.cedulaImage = 'La imagen de la cédula es obligatoria.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setCedulaImage(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit?.({ fullName, email, cedula, password, cedulaImage });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.header}>
        <div className={styles.brand}>
          <ShieldCheck size={32} />
          <span className={styles.brandText}>Sirona</span>
        </div>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Crear cuenta</h1>
          <p className={styles.subtitle}>Regístrate para acceder a Sirona</p>
        </div>
      </div>

      <div className={styles.formGrid}>
        {/* Columna izquierda: Campos del formulario */}
        <div className={styles.fields}>
          <Input
            id="fullName"
            label="Nombre completo"
            value={fullName}
            placeholder="Nombre y apellidos"
            onChange={setFullName}
            error={errors.fullName}
            autoComplete="name"
            icon={<User size={16} />}
          />

          <Input
            id="email"
            label="Correo"
            type="email"
            value={email}
            placeholder="tu@correo.com"
            onChange={setEmail}
            error={errors.email}
            autoComplete="email"
            icon={<Mail size={16} />}
          />

          <Input
            id="cedula"
            label="Cédula"
            value={cedula}
            placeholder="Número de cédula"
            onChange={setCedula}
            error={errors.cedula}
            autoComplete="off"
            icon={<CreditCard size={16} />}
          />

          <Input
            id="password"
            label="Contraseña"
            type="password"
            value={password}
            placeholder="••••••••"
            onChange={setPassword}
            error={errors.password}
            autoComplete="new-password"
            icon={<Lock size={16} />}
          />
          {password && <PasswordStrengthIndicator password={password} />}

          <Input
            id="confirmPassword"
            label="Repite la contraseña"
            type="password"
            value={confirmPassword}
            placeholder="••••••••"
            onChange={setConfirmPassword}
            error={errors.confirmPassword}
            autoComplete="new-password"
            icon={<Lock size={16} />}
          />
        </div>

        {/* Columna derecha: Imagen de cédula */}
        <CedulaUpload
          previewUrl={previewUrl}
          onFileSelect={handleFile}
          error={errors.cedulaImage}
          disabled={loading}
        />
      </div>

      <Button type="submit" variant="filled" color="primary" fullWidth disabled={loading}>
        {loading ? 'Registrando…' : 'Registrarse'}
      </Button>
    </form>
  );
}
