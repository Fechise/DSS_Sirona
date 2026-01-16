import React, { useEffect } from 'react';
import styles from './Modal.module.scss';
import { X } from 'lucide-react';
import { Button } from '../Button/Button';

export type ModalProps = {
  /**
   * Si el modal está abierto
   */
  isOpen: boolean;

  /**
   * Callback cuando se cierra el modal
   */
  onClose: () => void;

  /**
   * Título del modal
   */
  title: string;

  /**
   * Contenido del modal
   */
  children: React.ReactNode;

  /**
   * Ancho máximo del modal (opcional)
   */
  maxWidth?: string;

  /**
   * Permite cerrar haciendo clic fuera del modal
   */
  closeOnBackdropClick?: boolean;

  /**
   * Mostrar botón de cerrar (X)
   */
  showCloseButton?: boolean;
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '500px',
  closeOnBackdropClick = true,
  showCloseButton = true,
}) => {
  // Cerrar modal con tecla ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleBackdropClick}>
      <div className={styles.modalContent} style={{ maxWidth }}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          {showCloseButton && (
            <Button
              variant="ghost"
              onClick={onClose}
              aria-label="Cerrar modal"
              className={styles.closeButton}
            >
              <X size={20} />
            </Button>
          )}
        </div>
        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
};
