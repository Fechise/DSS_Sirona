import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './MedicalRecordPage.module.scss';
import { ShieldCheck, LogOut } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';

export const MedicalRecordPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandIcon} aria-hidden>
            <ShieldCheck size={28} />
          </span>
          <span className={styles.brandText}>Sirona</span>
        </div>
        <div className={styles.userInfo}>
          <span className={styles.email}>{user?.email}</span>
          <Button variant="filled" color="secondary" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Cerrar sesión</span>
          </Button>
        </div>
      </header>

      <main className={styles.main}>
        <h1>Historiales Médicos</h1>
        <p>Esta es una página protegida. Solo usuarios autenticados pueden verla.</p>
      </main>
    </div>
  );
};
