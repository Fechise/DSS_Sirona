import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './NoResults.module.scss';

type Props = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  fullHeight?: boolean;
};

export const NoResults: React.FC<Props> = ({ title, description, icon, action, fullHeight = false }) => {
  const { user } = useAuth();

  const getColorByRole = (): string => {
    switch (user?.role) {
      case 'Médico':
        return 'var(--role-doctor-color)';
      case 'Paciente':
        return 'var(--role-patient-color)';
      case 'Secretario':
        return 'var(--role-secretary-color)';
      case 'Administrador':
        return 'var(--role-admin-color)';
      default:
        return 'var(--role-patient-color)';
    }
  };

  const roleColor = getColorByRole();

  return (
    <div className={`${styles.wrapper} ${fullHeight ? styles.fullHeight : ''}`}>
      {icon && (
        <div className={styles.icon} style={{ color: roleColor }}>
          {icon}
        </div>
      )}
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
};
