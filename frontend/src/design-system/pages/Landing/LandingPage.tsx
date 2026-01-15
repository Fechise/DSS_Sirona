import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../atoms/Button/Button';
import { Container } from '../../atoms/Container/Container';
import { 
  UserCog, 
  Stethoscope, 
  Heart, 
  ClipboardList 
} from 'lucide-react';
import styles from './LandingPage.module.scss';

/**
 * Página de aterrizaje (Landing Page) de Sirona
 * Se muestra antes del login con presentación del sistema
 */
export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.landingPage}>
      {/* Header */}
      <header className={styles.header}>
        <Container>
          <div className={styles.headerContent}>
            <div className={styles.logo}>
              <h1 className={styles.logoText}>Sirona</h1>
            </div>
            <div className={styles.headerActions}>
              <Button
                variant="filled"
                onClick={() => navigate('/login')}
              >
                Iniciar sesión
              </Button>
              <Button
                variant="filled"
                onClick={() => navigate('/register')}
              >
                Registrarse
              </Button>
            </div>
          </div>
        </Container>
      </header>

      {/* Hero Section */}
      <main className={styles.hero}>
        <Container>
          <div className={styles.heroContent}>
            <div className={styles.heroText}>
              <h2 className={styles.title}>
                Bienvenido a <span className={styles.brandName}>Sirona</span>
              </h2>
              <p className={styles.subtitle}>
                Sistema Seguro de Historiales Médicos con arquitectura Zero Trust
              </p>
              <p className={styles.description}>
                Gestión integral de registros médicos con los más altos estándares 
                de seguridad y cumplimiento de Common Criteria.
              </p>
              <div className={styles.ctaButtons}>
                <Button
                  variant="filled"
                  onClick={() => navigate('/register')}
                >
                  Comenzar ahora
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/login')}
                >
                  Ya tengo cuenta
                </Button>
              </div>
            </div>

            {/* Collage de roles */}
            <div className={styles.rolesCollage}>
              <div className={styles.roleCard} data-role="admin">
                <div className={styles.roleIcon}>
                  <UserCog size={48} />
                </div>
                <h3 className={styles.roleTitle}>Administrador</h3>
                <p className={styles.roleDescription}>
                  Gestión de usuarios y configuración del sistema
                </p>
              </div>

              <div className={styles.roleCard} data-role="medico">
                <div className={styles.roleIcon}>
                  <Stethoscope size={48} />
                </div>
                <h3 className={styles.roleTitle}>Médico</h3>
                <p className={styles.roleDescription}>
                  Acceso y actualización de historiales médicos
                </p>
              </div>

              <div className={styles.roleCard} data-role="paciente">
                <div className={styles.roleIcon}>
                  <Heart size={48} />
                </div>
                <h3 className={styles.roleTitle}>Paciente</h3>
                <p className={styles.roleDescription}>
                  Consulta de tu información médica personal
                </p>
              </div>

              <div className={styles.roleCard} data-role="secretario">
                <div className={styles.roleIcon}>
                  <ClipboardList size={48} />
                </div>
                <h3 className={styles.roleTitle}>Secretario</h3>
                <p className={styles.roleDescription}>
                  Gestión de citas y registro de pacientes
                </p>
              </div>
            </div>
          </div>
        </Container>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <Container>
          <p className={styles.footerText}>
            © 2026 Sirona - Sistema Seguro de Historiales Médicos | Zero Trust Architecture
          </p>
        </Container>
      </footer>
    </div>
  );
};
