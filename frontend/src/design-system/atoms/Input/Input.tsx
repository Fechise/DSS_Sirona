import React from 'react';
import styles from './Input.module.scss';

type InputProps = {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password';
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
  icon?: React.ReactNode;
};

export const Input: React.FC<InputProps> = ({
  id,
  label,
  type = 'text',
  value,
  placeholder,
  onChange,
  error,
  autoComplete,
  icon,
}) => {
  return (
    <div className={styles.field}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {icon && <span className={styles.labelIcon}>{icon}</span>}
          {label}
        </label>
      )}
      <input
        id={id}
        className={[styles.input, error ? styles.inputError : ''].join(' ')}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        autoComplete={autoComplete}
      />
      {error && (
        <div id={`${id}-error`} className={styles.error}>
          {error}
        </div>
      )}
    </div>
  );
};