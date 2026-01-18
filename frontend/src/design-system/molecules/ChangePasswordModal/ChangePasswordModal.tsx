import React from 'react';
import { Modal } from '../../atoms/Modal/Modal';
import { ChangePasswordForm } from '../ChangePasswordForm/ChangePasswordForm';

type ChangePasswordModalProps = {
  /**
   * Si el modal está abierto
   */
  isOpen: boolean;

  /**
   * Callback cuando se cierra el modal
   */
  onClose: () => void;

  /**
   * Callback cuando se envía el formulario
   */
  onSubmit?: (data: { currentPassword: string; newPassword: string }) => Promise<void> | void;

  /**
   * Si se está cargando
   */
  loading?: boolean;

  /**
   * Color del botón según el rol
   */
  buttonColor?: 'primary' | 'secondary' | 'tertiary' | 'quaternary';
};

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  buttonColor = 'primary',
}) => {
  const handleSubmit = async (data: { currentPassword: string; newPassword: string }) => {
    await onSubmit?.(data);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cambiar Contraseña" maxWidth="700px">
      <ChangePasswordForm onSubmit={handleSubmit} loading={loading} buttonColor={buttonColor} />
    </Modal>
  );
};
