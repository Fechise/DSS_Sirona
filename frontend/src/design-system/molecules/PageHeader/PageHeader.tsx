import React, { type ReactNode } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './PageHeader.module.scss';

type PageHeaderProps = {
  title: string;
  icon: ReactNode;
  subtitle?: ReactNode;
  color?: 'primary' | 'secondary' | 'tertiary' | 'quaternary';
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  icon,
  subtitle,
  color,
}) => {
  const { user } = useAuth();

  // Mapear rol a color automáticamente si no se proporciona color explícitamente
  const getColorByRole = (): 'primary' | 'secondary' | 'tertiary' | 'quaternary' => {
    switch (user?.role) {
      case 'Médico':
        return 'primary';
      case 'Paciente':
        return 'secondary';
      case 'Secretario':
        return 'tertiary';
      case 'Administrador':
        return 'quaternary';
      default:
        return 'secondary';
    }
  };

  const finalColor = color || getColorByRole();

  return (
    <div className={`${styles.header} ${styles[finalColor]}`}>
      <div className={styles.titleSection}>
        <div className={styles.iconWrapper}>
          {icon}
        </div>
        <div className={styles.titleContent}>
          <h1>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};
