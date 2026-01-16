import React from 'react';
import styles from './Button.module.scss';

type ButtonProps = {
  children: React.ReactNode;
  type?: 'button' | 'submit';
<<<<<<< HEAD
  variant?: 'filled' | 'outlined' | 'icon' | 'ghost';
  color?: 'primary' | 'secondary' | 'tertiary' | 'quaternary' | 'danger';
=======
  variant?: 'filled' | 'outlined' | 'ghost' | 'icon';
  color?: 'primary' | 'secondary' | 'tertiary' | 'quaternary' | 'error';
  size?: 'sm' | 'md' | 'lg';
>>>>>>> feature/PBI-15-20-auditoria-integridad
  disabled?: boolean;
  onClick?: () => void;
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
<<<<<<< HEAD
  title?: string;
=======
  className?: string;
  'aria-label'?: string;
>>>>>>> feature/PBI-15-20-auditoria-integridad
};

export const Button: React.FC<ButtonProps> = ({
  children,
  type = 'button',
  variant = 'filled',
  color = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  fullWidth = false,
  startIcon,
  endIcon,
<<<<<<< HEAD
  title,
=======
  className = '',
  'aria-label': ariaLabel,
>>>>>>> feature/PBI-15-20-auditoria-integridad
}) => {
  const variantClass = variant === 'icon' ? styles.icon : styles[variant];
  const colorClass = styles[color];
  const sizeClass = styles[`size${size.charAt(0).toUpperCase()}${size.slice(1)}`];

  return (
    <button
      type={type}
      className={[
        styles.button,
        variantClass,
        colorClass,
        sizeClass,
        fullWidth ? styles.fullWidth : '',
        className,
      ].filter(Boolean).join(' ')}
      disabled={disabled}
      onClick={onClick}
<<<<<<< HEAD
      title={title}
=======
      aria-label={ariaLabel}
>>>>>>> feature/PBI-15-20-auditoria-integridad
    >
      {startIcon && <span className={styles.startIcon}>{startIcon}</span>}
      {children}
      {endIcon && <span className={styles.endIcon}>{endIcon}</span>}
    </button>
  );
};