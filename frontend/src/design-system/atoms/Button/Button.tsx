import React from 'react';
import styles from './Button.module.scss';

type ButtonProps = {
  children: React.ReactNode;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  onClick?: () => void;
  fullWidth?: boolean;
};

export const Button: React.FC<ButtonProps> = ({
  children,
  type = 'button',
  variant = 'primary',
  disabled = false,
  onClick,
  fullWidth = false,
}) => {
  return (
    <button
      type={type}
      className={[
        styles.button,
        styles[variant],
        fullWidth ? styles.fullWidth : '',
      ].join(' ')}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};