import React, { useState } from 'react';
import styles from './ChangePasswordForm.module.scss';
import { Input } from '../../atoms/Input/Input';
import { Button } from '../../atoms/Button/Button';
import { PasswordStrengthIndicator, validatePasswordStrength } from '../PasswordStrengthIndicator/PasswordStrengthIndicator';

type Props = {
  onSubmit?: (data: { currentPassword: string; newPassword: string }) => Promise<void> | void;
  loading?: boolean;
};

export const ChangePasswordForm: React.FC<Props> = ({ onSubmit, loading = false }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const passwordValidation = React.useMemo(() => validatePasswordStrength(newPassword), [newPassword]);

  const validate = () => {
    const next: typeof errors = {};
    
    if (!currentPassword) {
      next.currentPassword = 'La contraseña actual es obligatoria.';
    }
    
    if (!newPassword) {
      next.newPassword = 'La nueva contraseña es obligatoria.';
    } else if (!passwordValidation.valid) {
      next.newPassword = `La contraseña no cumple: ${passwordValidation.unmet.join(', ')}`;
    }
    
    if (!confirmPassword) {
      next.confirmPassword = 'Repite la nueva contraseña.';
    } else if (confirmPassword !== newPassword) {
      next.confirmPassword = 'Las contraseñas no coinciden.';
    }
    
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit?.({ currentPassword, newPassword });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.header}>
        <h2 className={styles.title}>Cambiar contraseña</h2>
        <p className={styles.subtitle}>Actualiza tu contraseña con una nueva y segura</p>
      </div>

      <div className={styles.fields}>
        <Input
          id="currentPassword"
          label="Contraseña actual"
          type="password"
          value={currentPassword}
          placeholder="••••••••"
          onChange={setCurrentPassword}
          error={errors.currentPassword}
          autoComplete="current-password"
        />

        <Input
          id="newPassword"
          label="Nueva contraseña"
          type="password"
          value={newPassword}
          placeholder="••••••••"
          onChange={setNewPassword}
          error={errors.newPassword}
          autoComplete="new-password"
        />
        {newPassword && <PasswordStrengthIndicator password={newPassword} />}

        <Input
          id="confirmPassword"
          label="Confirmar nueva contraseña"
          type="password"
          value={confirmPassword}
          placeholder="••••••••"
          onChange={setConfirmPassword}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />
      </div>

      <Button type="submit" variant="primary" fullWidth disabled={loading || !passwordValidation.valid}>
        {loading ? 'Cambiando contraseña...' : 'Cambiar contraseña'}
      </Button>
    </form>
  );
};
