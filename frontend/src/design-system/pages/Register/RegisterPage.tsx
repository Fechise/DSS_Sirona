import React, { useState } from 'react';
import styles from './RegisterPage.module.scss';
import { RegisterForm } from '../../molecules/RegisterForm/RegisterForm';
import type { RegisterData } from '../../molecules/RegisterForm/RegisterForm';
import { ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const RegisterPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (data: RegisterData) => {
    setLoading(true);
    try {
      // TODO: Integrar con FastAPI (POST /auth/register)
      // Ejemplo: usar FormData para enviar la imagen de la cédula
      // const form = new FormData();
      // form.append('fullName', data.fullName);
      // form.append('email', data.email);
      // form.append('cedula', data.cedula);
      // form.append('password', data.password);
      // if (data.cedulaImage) form.append('cedulaImage', data.cedulaImage);
      // await fetch('/api/auth/register', { method: 'POST', body: form });
      await new Promise((r) => setTimeout(r, 800));
      console.log('Register data', data);
      
      // Tras registro exitoso, redirigir a login
      navigate('/login');
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
        <RegisterForm onSubmit={handleSubmit} loading={loading} />
        <div className={styles.foot}>
          <button
            type="button"
            className={styles.ctaLink}
            onClick={() => navigate('/login')}
          >
            ¿Ya tienes cuenta? Inicia sesión
          </button>
        </div>
      </div>
    </div>
  );
}
