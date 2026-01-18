import React from 'react';
import styles from './Input.module.scss';

type InputProps = {
  id: string;
  label?: string;
  type?: 'text' | 'email' | 'password' | 'date' | 'time' | 'tel' | 'number';
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  error?: string;
  autoComplete?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  min?: string;
  max?: string;
  maxLength?: number;
  focusColor?: string;
  required?: boolean;
  isRequired?: boolean;
  requiredColor?: string;
};

export const Input: React.FC<InputProps> = ({
  id,
  label,
  type = 'text',
  value,
  placeholder,
  onChange,
  onKeyDown,
  error,
  autoComplete,
  icon,
  disabled,
  min,
  max,
  maxLength,
  focusColor,
  required,
  isRequired,
  requiredColor,
}) => {
  return (
    <div className={styles.field}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {icon && <span className={styles.labelIcon}>{icon}</span>}
          {label}
          {(isRequired !== undefined ? isRequired : required) && (
            <span className={styles.required} style={requiredColor ? { color: requiredColor } : undefined}>*</span>
          )}
        </label>
      )}
      <input
        id={id}
        className={[styles.input, error ? styles.inputError : ''].join(' ')}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        autoComplete={autoComplete}
        disabled={disabled}
        min={min}
        max={max}
        maxLength={maxLength}
        required={required}
        style={focusColor ? {
          '--input-focus-color': focusColor,
        } as React.CSSProperties : undefined}
      />
      {error && (
        <div id={`${id}-error`} className={styles.error}>
          {error}
        </div>
      )}
    </div>
  );
};