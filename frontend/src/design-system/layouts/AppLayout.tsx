import React from 'react';
import styles from './AppLayout.module.scss';
import { Header } from '../organisms/Header/Header';
import { useAuth } from '../../contexts/AuthContext';

type AppLayoutProps = {
  children: React.ReactNode;
};

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user } = useAuth();

  const getVariant = (): 'primary' | 'secondary' | 'tertiary' | 'quaternary' => {
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

  const variant = getVariant();

  return (
    <div className={`${styles.appContainer} ${styles[variant]}`}>
      <Header />
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
};
