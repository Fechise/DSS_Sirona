import React from 'react';
import styles from './Button.module.scss';

type ButtonProps = {
  children: React.ReactNode;
  type?: 'button' | 'submit';
  variant?: 'filled' | 'outlined' | 'icon' | 'ghost';
  color?: 'primary' | 'secondary' | 'tertiary' | 'quaternary' | 'danger';
  disabled?: boolean;
  onClick?: () => void;
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  title?: string;
};

export const Button: React.FC<ButtonProps> = ({
  children,
  type = 'button',
  variant = 'filled',
  color = 'primary',
  disabled = false,
  onClick,
  fullWidth = false,
  startIcon,
  endIcon,
  title,
}) => {
  const variantClass = variant === 'icon' ? styles.icon : styles[variant];
  const colorClass = styles[color];

  return (
    <button
      type={type}
      className={[
        styles.button,
        variantClass,
        colorClass,
        fullWidth ? styles.fullWidth : '',
      ].join(' ')}
      disabled={disabled}
      onClick={onClick}
      title={title}
    >
      {startIcon && <span className={styles.startIcon}>{startIcon}</span>}
      {children}
      {endIcon && <span className={styles.endIcon}>{endIcon}</span>}
    </button>
  );
};