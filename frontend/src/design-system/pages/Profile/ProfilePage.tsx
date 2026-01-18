import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Container } from '../../atoms/Container/Container';
import { ProfileSidebar } from '../../molecules/ProfileSidebar/ProfileSidebar';
import { GeneralSection } from '../../molecules/GeneralSection/GeneralSection';
import { SecuritySection } from '../../molecules/SecuritySection/SecuritySection';
import styles from './ProfilePage.module.scss';

type ProfileSection = 'general' | 'security';

export const ProfilePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<ProfileSection>('general');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handlePasswordChange = async (_data: {
    currentPassword: string;
    newPassword: string;
  }) => {
    try {
      setError(null);

      // Llamar al endpoint de cambio de contraseña
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Obtener el token del contexto
      const token = localStorage.getItem('sirona_token');
      if (!token) {
        throw new Error('Token no disponible');
      }

      // Importar AuthApiService si no está importado
      const { AuthApiService } = await import('../../../services/api');
      
      await AuthApiService.changePassword(token, {
        currentPassword: _data.currentPassword,
        newPassword: _data.newPassword,
      });

      // Si llegamos aquí, el cambio fue exitoso
      alert('Contraseña cambiada exitosamente');
      return;
    } catch (err: any) {
      const errorMessage = err?.detail || 'Error al cambiar la contraseña';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Container>
        <div className={styles.profileContainer}>
          <ProfileSidebar
            activeSection={activeSection}
            onSelectSection={setActiveSection}
          />

          <div className={styles.content}>
            {error && (
              <div className={styles.errorAlert}>
                <span>{error}</span>
              </div>
            )}

            <div className={styles.sectionContainer}>
              {activeSection === 'general' && <GeneralSection />}

              {activeSection === 'security' && (
                <SecuritySection onPasswordChange={handlePasswordChange} />
              )}
            </div>
          </div>
        </div>
      </Container>
    </>
  );
};
