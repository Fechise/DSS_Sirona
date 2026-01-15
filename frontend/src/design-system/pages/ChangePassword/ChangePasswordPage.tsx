import React, { useState } from 'react';
import styles from './ChangePasswordPage.module.scss';
import { ChangePasswordForm } from '../../molecules/ChangePasswordForm/ChangePasswordForm';
import { ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Container } from '../../atoms/Container/Container';

export const ChangePasswordPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (data: { currentPassword: string; newPassword: string }) => {
    setLoading(true);
    setSuccess(false);
    try {
      // TODO: Integrar con FastAPI (POST /auth/change-password)
      // const res = await fetch('/api/auth/change-password', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      //   body: JSON.stringify(data)
      // });
      // if (!res.ok) throw new Error('Failed to change password');
      await new Promise((r) => setTimeout(r, 800)); // simulación
      console.log('Change password data', data);
      
      setSuccess(true);
      // Redirigir tras un breve delay
      setTimeout(() => navigate('/inicio'), 2000);
    } catch (error) {
      console.error('Failed to change password:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <div className={styles.content}>
        <div className={styles.card}>
          <div className={styles.brand}>
            <span className={styles.brandIcon} aria-hidden>
              <ShieldCheck size={28} />
            </span>
            <span className={styles.brandText}>Sirona</span>
          </div>
          {success ? (
            <div className={styles.successMessage}>
              <p>✅ Contraseña cambiada exitosamente</p>
              <p className={styles.hint}>Redirigiendo al inicio...</p>
            </div>
          ) : (
            <ChangePasswordForm onSubmit={handleSubmit} loading={loading} />
          )}
        </div>
      </div>
    </Container>
  );
};
