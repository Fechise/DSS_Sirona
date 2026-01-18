import React, { useState } from 'react';
import styles from './ChangePasswordForm.module.scss';
import { Input } from '../../atoms/Input/Input';
import { Button } from '../../atoms/Button/Button';
import { PasswordStrengthIndicator, validatePasswordStrength } from '../PasswordStrengthIndicator/PasswordStrengthIndicator';
import { KeyRound, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';

type Props = {
  onSubmit?: (data: { currentPassword: string; newPassword: string }) => Promise<void> | void;
  loading?: boolean;
  buttonColor?: 'primary' | 'secondary' | 'tertiary' | 'quaternary';
};

export const ChangePasswordForm: React.FC<Props> = ({ onSubmit, loading = false, buttonColor = 'primary' }) => {
  const { success, error: showError } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const passwordValidation = React.useMemo(() => validatePasswordStrength(newPassword), [newPassword]);

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

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
    try {
      await onSubmit?.({ currentPassword, newPassword });
      success('Contraseña actualizada exitosamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
    } catch (err) {
      const apiError = err as { detail?: string };
      showError(apiError?.detail || 'Error al cambiar la contraseña');
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.container}>
        {/* Columna 1: Inputs */}
        <div className={styles.column}>
          <div className={styles.fieldGroup}>
            <Input
              id="currentPassword"
              label="Contraseña actual"
              type="password"
              value={currentPassword}
              placeholder="••••••••"
              onChange={setCurrentPassword}
              error={errors.currentPassword}
              autoComplete="current-password"
              icon={<KeyRound size={18} />}
            />
          </div>

          <div className={styles.columnDivider}></div>

          <div className={styles.fieldGroup}>
            <Input
              id="newPassword"
              label="Nueva contraseña"
              type="password"
              value={newPassword}
              placeholder="••••••••"
              onChange={setNewPassword}
              error={errors.newPassword}
              autoComplete="new-password"
              icon={<KeyRound size={18} />}
            />

            <Input
              id="confirmPassword"
              label="Confirmar nueva contraseña"
              type="password"
              value={confirmPassword}
              placeholder="••••••••"
              onChange={setConfirmPassword}
              error={errors.confirmPassword}
              autoComplete="new-password"
              icon={<KeyRound size={18} />}
            />
          </div>
        </div>

        {/* Columna 2: Indicador de fortaleza */}
        <div className={styles.column}>
          <PasswordStrengthIndicator password={newPassword} />

          {confirmPassword && (
            <div
              className={`${styles.panel} ${passwordsMatch ? styles.matchPanel : styles.mismatchPanel}`}
            >
              {passwordsMatch ? (
                <div className={styles.matchIndicator}>
                  <CheckCircle size={18} className={styles.matchIcon} />
                  <span className={styles.matchText}>Las contraseñas coinciden</span>
                </div>
              ) : (
                <div className={styles.matchIndicator}>
                  <AlertCircle size={18} className={styles.mismatchIcon} />
                  <span className={styles.mismatchText}>Las contraseñas no coinciden</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={styles.divider}></div>

      <Button type="submit" variant="filled" color={buttonColor} fullWidth disabled={loading || !passwordValidation.valid}>
        {loading ? 'Cambiando contraseña...' : 'Cambiar contraseña'}
      </Button>
    </form>
  );
};
