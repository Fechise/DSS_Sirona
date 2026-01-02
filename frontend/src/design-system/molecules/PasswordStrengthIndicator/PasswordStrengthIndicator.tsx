import React from 'react';
import styles from './PasswordStrengthIndicator.module.scss';
import { Check, X } from 'lucide-react';

export type PasswordRequirement = {
  key: string;
  ok: boolean;
  label: string;
};

type Props = {
  password: string;
};

export const PasswordStrengthIndicator: React.FC<Props> = ({ password }) => {
  const requirements: PasswordRequirement[] = [
    { key: 'length', ok: password.length >= 12, label: 'Mínimo 12 caracteres' },
    { key: 'upper', ok: /[A-Z]/.test(password), label: 'Al menos una mayúscula' },
    { key: 'lower', ok: /[a-z]/.test(password), label: 'Al menos una minúscula' },
    { key: 'digit', ok: /\d/.test(password), label: 'Al menos un número' },
    { key: 'special', ok: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), label: 'Al menos un símbolo especial' },
  ];

  const allMet = requirements.every(r => r.ok);
  const metCount = requirements.filter(r => r.ok).length;

  return (
    <div className={styles.container} aria-live="polite">
      <div className={styles.header}>
        <span className={styles.title}>Requisitos de contraseña</span>
        <span className={[styles.badge, allMet ? styles.complete : ''].join(' ')}>
          {metCount}/{requirements.length}
        </span>
      </div>
      <ul className={styles.requirements}>
        {requirements.map((req) => (
          <li key={req.key} className={[styles.requirement, req.ok ? styles.met : ''].join(' ')}>
            <span className={styles.icon}>
              {req.ok ? (
                <Check size={16} strokeWidth={2.5} />
              ) : (
                <X size={16} strokeWidth={2.5} />
              )}
            </span>
            <span className={styles.label}>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const validatePasswordStrength = (password: string): { valid: boolean; unmet: string[] } => {
  const requirements = [
    { ok: password.length >= 12, label: 'Mínimo 12 caracteres' },
    { ok: /[A-Z]/.test(password), label: 'Al menos una mayúscula' },
    { ok: /[a-z]/.test(password), label: 'Al menos una minúscula' },
    { ok: /\d/.test(password), label: 'Al menos un número' },
    { ok: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), label: 'Al menos un símbolo especial' },
  ];
  
  const unmet = requirements.filter(r => !r.ok).map(r => r.label);
  return { valid: unmet.length === 0, unmet };
};
