import React from 'react';
import styles from './HomePage.module.scss';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { FileText, UserCog, Users, Settings } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { Container } from '../../atoms/Container/Container';
import { PageHeader } from '../../molecules/PageHeader/PageHeader';

export const PaginaInicio: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const renderContent = () => {
    switch (user?.role) {
      case 'Paciente':
        return (
          <>
            <PageHeader
              title={`Bienvenido, ${user.fullName || user.name}`}
              subtitle="Accede a tu historial clínico personal y gestiona tu salud."
              icon={<FileText size={20} />}
            />
            <div className={styles.actions}>
              <Button
                variant="filled"
                color="secondary"
                onClick={() => navigate('/paciente/mi-historial')}
                startIcon={<FileText size={16} />}
              >
                Mi Historial Clínico
              </Button>
              <Button
                variant="filled"
                color="primary"
                onClick={() => navigate('/perfil')}
                startIcon={<UserCog size={16} />}
              >
                Mi Perfil
              </Button>
            </div>
          </>
        );

      case 'Médico':
        return (
          <>
            <PageHeader
              title="Panel del Médico"
              subtitle="Gestiona tus pacientes y accede a sus historiales clínicos."
              icon={<Users size={20} />}
            />
            <div className={styles.actions}>
              <Button
                variant="filled"
                color="primary"
                onClick={() => navigate('/medico/pacientes')}
                startIcon={<Users size={16} />}
              >
                Mis Pacientes
              </Button>
              <Button
                variant="filled"
                color="secondary"
                onClick={() => navigate('/perfil')}
                startIcon={<UserCog size={16} />}
              >
                Mi Perfil
              </Button>
            </div>
          </>
        );

      case 'Secretario':
        return (
          <>
            <PageHeader
              title="Panel del Secretario"
              subtitle="Gestiona pacientes y agenda citas médicas."
              icon={<FileText size={20} />}
            />
            <div className={styles.actions}>
              <Button
                variant="filled"
                color="primary"
                onClick={() => navigate('/pacientes')}
                startIcon={<Users size={16} />}
              >
                Listado de Pacientes
              </Button>
              <Button
                variant="filled"
                color="secondary"
                onClick={() => navigate('/secretario/citas')}
                startIcon={<FileText size={16} />}
              >
                Agendar Citas
              </Button>
              <Button
                variant="filled"
                color="tertiary"
                onClick={() => navigate('/perfil')}
                startIcon={<UserCog size={16} />}
              >
                Mi Perfil
              </Button>
            </div>
          </>
        );

      case 'Administrador':
        return (
          <>
            <PageHeader
              title="Panel de Administración"
              subtitle="Gestiona usuarios, roles y configuración del sistema."
              icon={<Settings size={20} />}
            />
            <div className={styles.actions}>
              <Button
                variant="filled"
                color="primary"
                onClick={() => navigate('/admin/usuarios')}
                startIcon={<Users size={16} />}
              >
                Gestionar Usuarios
              </Button>
              <Button
                variant="filled"
                color="secondary"
                onClick={() => navigate('/admin/configuracion')}
                startIcon={<Settings size={16} />}
              >
                Configuración
              </Button>
              <Button
                variant="filled"
                color="tertiary"
                onClick={() => navigate('/perfil')}
                startIcon={<UserCog size={16} />}
              >
                Mi Perfil
              </Button>
            </div>
          </>
        );

      default:
        return (
          <>
            <h1>Bienvenido a Sirona</h1>
            <p>Sistema de Gestión Hospitalaria Segura</p>
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
