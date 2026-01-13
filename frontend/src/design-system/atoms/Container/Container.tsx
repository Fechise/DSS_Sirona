import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './Container.module.scss';

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Container con fondo automático según rol del usuario
 * - Médico → background-primary (violeta 6%)
 * - Paciente → background-secondary (teal 6%)
 * - Secretario → background-tertiary (salmón 6%)
 * - Administrador → background-quaternary (azul 6%)
 */
export const Container: React.FC<ContainerProps> = ({ children, className = '' }) => {
  const { user } = useAuth();

  // Mapeo de roles a variantes de color
  const getColorVariant = (): 'primary' | 'secondary' | 'tertiary' | 'quaternary' => {
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
        return 'primary';
    }
  };

  const variant = getColorVariant();

  return (
    <div className={`${styles.container} ${styles[variant]}`}>
      <div className={`${styles.content} ${className}`.trim()}>
        {children}
      </div>
    </div>
  );
};
