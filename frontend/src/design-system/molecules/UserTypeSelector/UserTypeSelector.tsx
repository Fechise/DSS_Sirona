import React, { useState, useRef, useEffect } from 'react';
import styles from './UserTypeSelector.module.scss';
import { User, Stethoscope, ChevronDown } from 'lucide-react';

type UserType = 'patient' | 'doctor';

type Props = {
  value: UserType;
  onChange: (type: UserType) => void;
};

const options = [
  { value: 'patient', label: 'Paciente', icon: User },
  { value: 'doctor', label: 'Médico', icon: Stethoscope },
] as const;

export const UserTypeSelector: React.FC<Props> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentOption = options.find(opt => opt.value === value);
  const CurrentIcon = currentOption?.icon || User;
  const themeColor = value === 'doctor' ? 'var(--role-doctor-color)' : 'var(--role-patient-color)';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  const handleSelect = (type: UserType) => {
    onChange(type);
    setIsOpen(false);
  };

  return (
    <div 
      className={styles.container} 
      ref={containerRef}
      style={{ '--selector-theme-color': themeColor } as React.CSSProperties}
    >
      <button
        className={`${styles.trigger} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className={styles.triggerContent}>
          <CurrentIcon size={18} className={styles.icon} />
          <span className={styles.label}>{currentOption?.label}</span>
        </div>
        <ChevronDown size={16} className={styles.chevron} />
      </button>

      {isOpen && (
        <div className={styles.menu}>
          {options.map((option) => {
            const OptionIcon = option.icon;
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                className={`${styles.menuItem} ${isSelected ? styles.selected : ''}`}
                onClick={() => handleSelect(option.value)}
                type="button"
                role="option"
                aria-selected={isSelected}
              >
                <OptionIcon size={18} className={styles.optionIcon} />
                <span className={styles.optionLabel}>{option.label}</span>
                {isSelected && <div className={styles.selectedIndicator} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
