import React, { useState, useRef, useEffect } from 'react';
import styles from './DropdownMenu.module.scss';

export type DropdownMenuColor = 'primary' | 'secondary' | 'tertiary' | 'quaternary';

export type DropdownMenuItem = {
  /**
   * Identificador único
   */
  id: string;

  /**
   * Icono a mostrar (React component)
   */
  icon?: React.ReactNode;

  /**
   * Texto del item
   */
  label: string;

  /**
   * Callback cuando se hace clic
   */
  onClick: () => void;

  /**
   * Variante del item (normal o danger)
   */
  variant?: 'default' | 'danger';
};

export type DropdownMenuProps = {
  /**
   * Trigger del dropdown (botón)
   */
  trigger: React.ReactNode;

  /**
   * Items del menú
   */
  items: DropdownMenuItem[];

  /**
   * Color del tema basado en rol
   */
  color?: DropdownMenuColor;

  /**
   * Callback cuando se abre/cierra
   */
  onOpenChange?: (isOpen: boolean) => void;

  /**
   * Posición del dropdown
   */
  position?: 'left' | 'right';

  /**
   * Mostrar separador entre items
   */
  showDividers?: boolean;
};

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  items,
  color = 'primary',
  onOpenChange,
  position = 'right',
  showDividers = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Cerrar menú con tecla ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onOpenChange?.(newState);
  };

  const handleItemClick = (callback: () => void) => {
    callback();
    setIsOpen(false);
  };

  return (
    <div className={styles.dropdownContainer} ref={menuRef}>
      <div onClick={handleToggle} className={styles.trigger}>
        {trigger}
      </div>

      {isOpen && (
        <div className={`${styles.menu} ${styles[position]} ${styles[color]}`}>
          {items.map((item, index) => (
            <React.Fragment key={item.id}>
              <button
                className={`${styles.item} ${styles[item.variant || 'default']}`}
                onClick={() => handleItemClick(item.onClick)}
              >
                {item.icon && <span className={styles.icon}>{item.icon}</span>}
                <span className={styles.label}>{item.label}</span>
              </button>
              {showDividers && index < items.length - 1 && (
                <div className={styles.divider} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
