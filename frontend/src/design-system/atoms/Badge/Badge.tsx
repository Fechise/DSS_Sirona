import React from 'react';
import styles from './Badge.module.scss';

export type BadgeType = 'role' | 'status' | 'outlined';

type BadgeProps = {
  value: string | React.ReactNode;
  type: BadgeType;
  className?: string;
};

export const Badge: React.FC<BadgeProps> = ({ value, type, className = '' }) => {
  // Para tipo 'outlined', no usar el mapeo de colores
  if (type === 'outlined') {
    return (
      <span className={`${styles.outlinedBadge} ${className}`.trim()}>
        {value}
      </span>
    );
  }

  const typePrefix = type === 'role' ? 'role' : 'status';
  const sanitizedValue = typeof value === 'string' ? value.replace(/\s+/g, '') : '';
  const baseClass = type === 'role' ? styles.roleBadge : styles.statusBadge;
  const variantClass = sanitizedValue ? styles[`${typePrefix}${sanitizedValue}`] : '';

  return (
    <span className={`${baseClass} ${variantClass} ${className}`.trim()}>
      <span className={styles.dot} />
      <span className={styles.label}>{value}</span>
    </span>
  );
};
