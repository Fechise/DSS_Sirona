import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './SecuritySection.module.scss';
import { Button } from '../../atoms/Button/Button';
import { KeyRound } from 'lucide-react';
import { ChangePasswordModal } from '../ChangePasswordModal/ChangePasswordModal';

type SecuritySectionProps = {
  onPasswordChange?: (data: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<void> | void;
};

export const SecuritySection: React.FC<SecuritySectionProps> = ({
  onPasswordChange,
}) => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getColorByRole = (): 'primary' | 'secondary' | 'tertiary' | 'quaternary' => {
    switch (user?.role) {
      case 'Médico':
        return 'primary';
      case 'Paciente':
        return 'secondary';
      case 'Secretario':
        return 'tertiary';
      case 'Administrador':
        return 'quaternary';
      default:
        return 'secondary';
    }
  };

  const roleColor = getColorByRole();

  const handlePasswordChange = async (data: {
    currentPassword: string;
    newPassword: string;
  }) => {
    await onPasswordChange?.(data);
    setIsModalOpen(false);
  };

  return (
    <div className={`${styles.section} ${styles[roleColor]}`}>
      <div className={styles.header}>
        <h2>Seguridad</h2>
        <p className={styles.subtitle}>
          Gestiona la seguridad y acceso de tu cuenta
        </p>
      </div>

      <div className={styles.card}>
        <div className={styles.cardContent}>
          <div className={styles.cardInfo}>
            <div className={styles.iconWrapper}>
              <KeyRound size={28} />
            </div>
            <div className={styles.textContent}>
              <h3>Contraseña</h3>
              <p>
                Cambia tu contraseña periódicamente para mantener tu cuenta segura y protegida
              </p>
            </div>
          </div>
          <Button
            variant="filled"
            color={roleColor}
            onClick={() => setIsModalOpen(true)}
            startIcon={<KeyRound size={16} />}
          >
            Cambiar Contraseña
          </Button>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handlePasswordChange}
        buttonColor={roleColor}
      />
    </div>
  );
};
