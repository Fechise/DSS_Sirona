import React from 'react';
import { useToast } from '../../../hooks/useToast';
import { Toast } from '../../atoms/Toast/Toast';
import styles from './ToastContainer.module.scss';

/**
 * ToastContainer - Renderiza todos los toasts activos
 * Debe estar en la raíz de la aplicación (dentro de AppLayout o App)
 */
export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={removeToast}
        />
      ))}
    </div>
  );
};
