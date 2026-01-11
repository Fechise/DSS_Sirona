import React from 'react';
import styles from './HomePage.module.scss';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { FileText, UserCog, Users } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { Container } from '../../atoms/Container/Container';

export const PaginaInicio: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const renderContent = () => {
    switch (user?.role) {
      case 'Paciente':
        return (
          <>
            <h1>Bienvenido, {user.name}</h1>
            <p>Accede a tu historial clínico personal.</p>
            <div className={styles.actions}>
              <Button
                variant="filled"
                color="secondary"
                onClick={() => navigate('/paciente/mi-historial')}
                startIcon={<FileText size={16} />}
              >
                Mi Historial Clínico
              </Button>
            </div>
          </>
        );

      case 'Médico':
        return (
          <>
            <h1>Panel del Médico</h1>
            <p>Gestiona tus pacientes y accede a sus historiales clínicos.</p>
            <div className={styles.actions}>
              <Button
                variant="filled"
                color="primary"
                onClick={() => navigate('/medico/pacientes')}
                startIcon={<Users size={16} />}
              >
                Mis Pacientes
              </Button>
            </div>
          </>
        );

      case 'Administrador':
        return (
          <>
            <h1>Panel de Administración</h1>
            <p>Gestiona usuarios y controla el sistema.</p>
            <div className={styles.actions}>
              <Button
                variant="filled"
                color="quaternary"
                onClick={() => navigate('/admin/usuarios')}
                startIcon={<UserCog size={16} />}
              >
                Gestión de Usuarios
              </Button>
            </div>
          </>
        );

      case 'Secretario':
        return (
          <>
            <h1>Panel del Secretario</h1>
            <p>Accede a historiales y administración.</p>
            <div className={styles.actions}>
              <Button
                variant="filled"
                color="tertiary"
                onClick={() => navigate('/historiales')}
                startIcon={<FileText size={16} />}
              >
                Historiales
              </Button>
            </div>
          </>
        );

      default:
        return (
          <>
            <h1>Panel Principal</h1>
            <p>Accede a historiales, pacientes y administración desde un solo lugar.</p>
            <div className={styles.actions}>
              <Button
                variant="filled"
                color="primary"
                onClick={() => navigate('/historiales')}
                startIcon={<FileText size={16} />}
              >
                Historiales
              </Button>
              <Button
                variant="filled"
                color="secondary"
                onClick={() => navigate('/login')}
                startIcon={<UserCog size={16} />}
              >
                Administración
              </Button>
            </div>
          </>
        );
    }
  };

  return (
    <Container>
      <main className={styles.main}>
        <section className={styles.hero}>{renderContent()}</section>
      </main>
    </Container>
  );
};
