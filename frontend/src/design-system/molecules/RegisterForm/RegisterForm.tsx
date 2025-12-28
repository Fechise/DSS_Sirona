import React, { useState } from 'react';
import styles from './RegisterForm.module.scss';
import { Input } from '../../atoms/Input/Input';
import { Button } from '../../atoms/Button/Button';
import { Upload, Camera } from 'lucide-react';

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

  const passwordFeedback = React.useMemo(() => {
    const checks = [
      { key: 'length', ok: password.length >= 12, label: '12+ caracteres' },
      { key: 'upper', ok: /[A-Z]/.test(password), label: 'Una mayúscula' },
      { key: 'lower', ok: /[a-z]/.test(password), label: 'Una minúscula' },
      { key: 'digit', ok: /\d/.test(password), label: 'Un número' },
      { key: 'special', ok: /[^\w\s]/.test(password), label: 'Un símbolo' },
      { key: 'noSpace', ok: !/\s/.test(password), label: 'Sin espacios' },
    ];
    const passed = checks.filter(c => c.ok).length;
    const unmet = checks.filter(c => !c.ok).map(c => c.label);
    let level: 'weak' | 'medium' | 'strong' = 'weak';
    if (passed >= 4) level = 'medium';
    if (passed >= 5 && password.length >= 14) level = 'strong';
    return { level, unmet, passed };
  }, [password]);

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
    if (passwordFeedback.unmet.length) {
      next.password = `La contraseña no cumple: ${passwordFeedback.unmet.join(', ')}`;
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
        <h1 className={styles.title}>Crear cuenta</h1>
        <p className={styles.subtitle}>Regístrate para acceder a Sirona</p>
      </div>

      <div className={styles.fields}>
        <Input
          id="fullName"
          label="Nombre completo"
          value={fullName}
          placeholder="Nombre y apellidos"
          onChange={setFullName}
          error={errors.fullName}
          autoComplete="name"
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
        />

        <Input
          id="cedula"
          label="Cédula"
          value={cedula}
          placeholder="Número de cédula"
          onChange={setCedula}
          error={errors.cedula}
          autoComplete="off"
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
        />
        <div className={styles.strengthRow} aria-live="polite">
          <span
            className={[
              styles.strengthBadge,
              passwordFeedback.level === 'weak' ? styles.weak : '',
              passwordFeedback.level === 'medium' ? styles.medium : '',
              passwordFeedback.level === 'strong' ? styles.strong : '',
            ].join(' ')}
          >
            {passwordFeedback.level === 'weak' && 'Débil'}
            {passwordFeedback.level === 'medium' && 'Media'}
            {passwordFeedback.level === 'strong' && 'Fuerte'}
          </span>
          {passwordFeedback.unmet.length > 0 && (
            <ul className={styles.requirements}>
              {passwordFeedback.unmet.map((req) => (
                <li key={req}>{req}</li>
              ))}
            </ul>
          )}
        </div>

        <Input
          id="confirmPassword"
          label="Repite la contraseña"
          type="password"
          value={confirmPassword}
          placeholder="••••••••"
          onChange={setConfirmPassword}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        <div className={styles.uploadRow}>
          <label className={styles.uploadLabel} htmlFor="cedulaImage">
            <span className={styles.uploadText}>Imagen de cédula</span>
            <span className={styles.hint}>Sube o captura una foto</span>
          </label>

          <div className={styles.uploadControls}>
            <label className={styles.uploadButton}>
              <Upload size={18} />
              <span>Subir imagen</span>
              <input
                id="cedulaImage"
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e.target.files?.[0])}
                hidden
              />
            </label>
            <label className={styles.captureButton}>
              <Camera size={18} />
              <span>Capturar</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handleFile(e.target.files?.[0])}
                hidden
              />
            </label>
          </div>
          {errors.cedulaImage && (
            <div className={styles.error}>{errors.cedulaImage}</div>
          )}

          {previewUrl && (
            <div className={styles.preview}>
              <img src={previewUrl} alt="Previsualización de cédula" />
            </div>
          )}
        </div>
      </div>

      <Button type="submit" variant="primary" fullWidth disabled={loading}>
        {loading ? 'Registrando…' : 'Registrarse'}
      </Button>
    </form>
  );
}
