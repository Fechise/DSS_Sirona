import React from 'react';
import { Lock, Home } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { Container } from '../../atoms/Container/Container';
import { useNavigate } from 'react-router-dom';
import styles from './Forbidden403Page.module.scss';

export const Forbidden403Page: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container>
      <div className={styles.forbidden}>
        <div className={styles.iconWrapper}>
          <Lock size={64} />
        </div>
        <h1>Acceso Denegado</h1>
        <p className={styles.errorCode}>Error 403 - Acceso Prohibido</p>
        <p className={styles.description}>
          No tienes permisos para acceder a los historiales clínicos. Esta funcionalidad está reservada para médicos.
        </p>
        <p className={styles.note}>
          <strong>Nota PBI-16 (Seguridad):</strong> Los secretarios solo tienen acceso a la gestión de agendamiento de citas,
          no a los historiales clínicos de los pacientes.
        </p>
        <div className={styles.actions}>
          <Button
            variant="filled"
            color="primary"
            onClick={() => navigate('/inicio')}
            startIcon={<Home size={18} />}
          >
            Ir al Inicio
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate('/secretario/citas')}
          >
            Ir a Agendamiento
          </Button>
        </div>
      </div>
    </Container>
  );
};
