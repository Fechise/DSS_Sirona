import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './FilterSelect.module.scss';

type FilterSelectProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
};

/**
 * Componente compacto y dinámico para filtros en toolbars
 * - Dropdown personalizado con estilos por rol
 * - Flecha animada que rota cuando está abierto
 * - Altura normalizada para alinearse con botones
 */
export const FilterSelect: React.FC<FilterSelectProps> = ({
  id,
  value,
  onChange,
  placeholder = 'Filtrar...',
  options,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Obtener label de la opción seleccionada
  const selectedLabel = value
    ? options.find((opt) => opt.value === value)?.label || placeholder
    : placeholder;

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={`${styles.wrapper} ${isOpen ? styles.open : ''}`}
    >
      <button
        ref={buttonRef}
        id={id}
        className={styles.button}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={styles.label}>{selectedLabel}</span>
      </button>
      <div 
        className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        role="presentation"
      >
        <ChevronDown size={18} />
      </div>

      {isOpen && (
        <div className={styles.dropdown} role="listbox">
          {options.map((option) => (
            <div
              key={option.value}
              className={`${styles.option} ${
                value === option.value ? styles.selected : ''
              }`}
              role="option"
              aria-selected={value === option.value}
              onClick={() => handleSelect(option.value)}
              onKeyDown={handleKeyDown}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
