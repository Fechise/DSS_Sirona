import React, { type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './AlertNote.module.scss';

type AlertNoteProps = {
  title: string;
  children?: ReactNode;
  color?: 'primary' | 'secondary' | 'tertiary' | 'quaternary';
  icon?: ReactNode;
};

export const AlertNote: React.FC<AlertNoteProps> = ({
  title,
  children,
  color,
  icon = <AlertCircle size={16} />,
}) => {
  const { user } = useAuth();

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
    <div className={`${styles.alertNote} ${styles[finalColor]}`}>
      <div className={styles.iconWrapper}>
        {icon}
      </div>
      <div className={styles.content}>
        <strong>{title}</strong>
        {children && <p>{children}</p>}
      </div>
    </div>
  );
};
