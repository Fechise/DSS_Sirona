import React, { useState } from 'react';
import styles from './SecuritySection.module.scss';
import { Button } from '../../atoms/Button/Button';
import { KeyRound, CheckCircle } from 'lucide-react';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);

  const handlePasswordChange = async (data: {
    currentPassword: string;
    newPassword: string;
  }) => {
    await onPasswordChange?.(data);
    setPasswordChanged(true);
    
    // Ocultar mensaje después de 3 segundos
    setTimeout(() => {
      setPasswordChanged(false);
    }, 3000);
  };

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h2>Seguridad</h2>
        <p className={styles.subtitle}>
          Gestiona la seguridad y acceso de tu cuenta
        </p>
      </div>

      {passwordChanged && (
        <div className={styles.successAlert}>
          <CheckCircle size={20} />
          <span>Contraseña actualizada exitosamente</span>
        </div>
      )}

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleGroup}>
            <KeyRound size={24} />
            <div>
              <h3>Contraseña</h3>
              <p className={styles.cardSubtitle}>
                Cambia tu contraseña periódicamente para mantener tu cuenta segura
              </p>
            </div>
          </div>
          <Button
            variant="filled"
            color="primary"
            onClick={() => setIsModalOpen(true)}
            startIcon={<KeyRound size={16} />}
          >
            Cambiar Contraseña
          </Button>
        </div>

        <div className={styles.securityInfo}>
          <h4>Requisitos de contraseña:</h4>
          <ul>
            <li>Mínimo 12 caracteres</li>
            <li>Al menos una mayúscula</li>
            <li>Al menos una minúscula</li>
            <li>Al menos un número</li>
            <li>Al menos un símbolo especial</li>
          </ul>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handlePasswordChange}
      />
    </div>
  );
};
