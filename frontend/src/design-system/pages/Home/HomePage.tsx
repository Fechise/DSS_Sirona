import React from 'react';
import styles from './HomePage.module.scss';
import { useNavigate, Link } from 'react-router-dom';
import { FileText, UserCog } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { Container } from '../../atoms/Container/Container';
import { Header } from '../../organisms/Header/Header';

export const PaginaInicio: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container>
      <Header />
      <main className={styles.main}>
        <section className={styles.hero}>
          <h1>Panel principal</h1>
          <p>Accede a historiales, pacientes y administración desde un solo lugar.</p>
          <div className={styles.actions}>
            <Button variant="primary" onClick={() => navigate('/historiales')} startIcon={<FileText size={16} />}>
              Historiales
            </Button>
            <Button variant="secondary" onClick={() => navigate('/login')} startIcon={<UserCog size={16} />}>
              Administración
            </Button>
          </div>
        </section>

        <section className={styles.links}>
          <Link to="/historiales">Ir a historiales</Link>
          <Link to="/login">Administración (placeholder)</Link>
        </section>
      </main>
    </Container>
  );
};
