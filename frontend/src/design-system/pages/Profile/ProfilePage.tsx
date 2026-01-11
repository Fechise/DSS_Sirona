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

      // TODO: Integrar con backend (POST /auth/change-password)
      // const response = await fetch('/auth/change-password', {
      //   method: 'POST',
      //   headers: { 
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`
      //   },
      //   body: JSON.stringify({
      //     currentPassword: _data.currentPassword,
      //     newPassword: _data.newPassword,
      //   })
      // });
      // 
      // if (!response.ok) {
      //   const errorInfo = handleApiError(response.status);
      //   setError(errorInfo.message);
      //   throw new Error(errorInfo.message);
      // }

      // Mock: Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      return;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cambiar la contraseña';
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
