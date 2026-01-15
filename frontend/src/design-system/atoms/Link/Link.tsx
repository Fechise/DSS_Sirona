import React from 'react';
import styles from './Link.module.scss';

type LinkProps = {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'subtle';
  disabled?: boolean;
};

export const Link: React.FC<LinkProps> = ({
  onClick,
  children,
  variant = 'default',
  disabled = false,
}) => {
  return (
    <button
      type="button"
      className={[styles.link, styles[variant]].join(' ')}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
