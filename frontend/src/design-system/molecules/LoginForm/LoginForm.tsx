import React, { useState } from 'react';
import styles from './LoginForm.module.scss';
import { Input } from '../../atoms/Input/Input';
import { Button } from '../../atoms/Button/Button';
import { AlertCircle } from 'lucide-react';

type Props = {
  onSubmit?: (data: { email: string; password: string }) => Promise<void> | void;
  loading?: boolean;
  isAccountLocked?: boolean;
};

export const LoginForm: React.FC<Props> = ({ onSubmit, loading = false, isAccountLocked = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const next: { email?: string; password?: string } = {};
    if (!email) next.email = 'El correo es obligatorio.';
    else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'El correo no es válido.';
    if (!password) next.password = 'La contraseña es obligatoria.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit?.({ email, password });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.header}>
        <h1 className={styles.title}>Iniciar sesión</h1>
        <p className={styles.subtitle}>Accede con tu correo y contraseña</p>
      </div>

      {isAccountLocked && (
        <div className={styles.alert}>
          <AlertCircle size={20} />
          <span>Cuenta bloqueada por 15 minutos</span>
        </div>
      )}

      <div className={styles.fields}>
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
          id="password"
          label="Contraseña"
          type="password"
          value={password}
          placeholder="••••••••"
          onChange={setPassword}
          error={errors.password}
          autoComplete="current-password"
        />
      </div>

      <Button type="submit" variant="filled" color="primary" fullWidth disabled={loading || isAccountLocked}>
        {loading ? 'Ingresando...' : 'Ingresar'}
      </Button>
    </form>
  );
};