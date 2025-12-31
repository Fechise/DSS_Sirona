import React from 'react';
import styles from './Header.module.scss';
import { ShieldCheck, LogOut } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.brandIcon} aria-hidden>
          <ShieldCheck size={28} />
        </span>
        <span className={styles.brandText}>Sirona</span>
      </div>
      <div className={styles.userInfo}>
        <span className={styles.email}>{user?.email}</span>
        <Button
          variant="secondary"
          onClick={handleLogout}
          startIcon={<LogOut size={16} />}
        >
          Cerrar sesión
        </Button>
      </div>
    </header>
  );
};