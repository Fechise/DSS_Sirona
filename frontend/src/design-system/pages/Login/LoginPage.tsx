import React, { useState } from 'react';
import styles from './LoginPage.module.scss';
import { LoginForm } from '../../molecules/LoginForm/LoginForm';
import { ShieldCheck } from 'lucide-react';

type Props = {
  onNavigateRegister?: () => void;
};

export const LoginPage: React.FC<Props> = ({ onNavigateRegister }) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: { email: string; password: string }) => {
    setLoading(true);
    try {
      // TODO: integrar con FastAPI (ej. POST /auth/login)
      // const res = await fetch('/api/auth/login', { ... });
      await new Promise((r) => setTimeout(r, 600)); // simulación
      // manejar respuesta, guardar token, redirigir, etc.
      console.log('Login data', data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.brandIcon} aria-hidden>
            <ShieldCheck size={28} />
          </span>
          <span className={styles.brandText}>Sirona</span>
        </div>
        <LoginForm onSubmit={handleSubmit} loading={loading} />
        <div className={styles.foot}>
          <button
            type="button"
            className={styles.ctaLink}
            onClick={() => onNavigateRegister?.()}
          >
            ¿No estás registrado? Regístrate aquí
          </button>
        </div>
      </div>
    </div>
  );
};