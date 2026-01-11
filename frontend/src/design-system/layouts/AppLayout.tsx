import React from 'react';
import styles from './AppLayout.module.scss';
import { Header } from '../organisms/Header/Header';

type AppLayoutProps = {
  children: React.ReactNode;
};

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className={styles.appContainer}>
      <Header />
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
};
