import React from 'react';
import { User, Stethoscope, Calendar, Shield } from 'lucide-react';
import styles from './LoadingSpinner.module.scss';

export interface LoadingSpinnerProps {
  variant?: 'spinner' | 'bouncing-icons' | 'bouncing-role';
  role?: 'Médico' | 'Paciente' | 'Secretario' | 'Administrador';
  message?: string;
  size?: 'small' | 'medium' | 'large';
  customIcon?: React.ReactNode;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  variant = 'bouncing-role',
  role = 'Médico',
  message = 'Cargando...',
  size = 'medium',
  customIcon
}) => {
  // Mapeo de roles a colores
  const roleColorMap: Record<string, string> = {
    'Médico': 'primary',
    'Paciente': 'secondary',
    'Secretario': 'tertiary',
    'Administrador': 'quaternary'
  };

  const colorClass = roleColorMap[role] || 'primary';

  // Dividir mensaje en letras para animación tipo dominó
  const renderAnimatedMessage = () => {
    if (!message) return null;
    
    return (
      <p className={styles.messageContainer}>
        {message.split('').map((char, index) => (
          <span
            key={index}
            className={styles.messageLetter}
            style={{
              animationDelay: `${index * 0.05}s`
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </p>
    );
  };

  // Renderizar spinner tradicional
  if (variant === 'spinner') {
    return (
      <div className={styles.container}>
        <div className={`${styles.spinner} ${styles[colorClass]} ${styles[size]}`} />
        {renderAnimatedMessage()}
      </div>
    );
  }

  // Renderizar íconos de todos los roles saltando
  if (variant === 'bouncing-icons') {
    return (
      <div className={styles.container}>
        <div className={styles.bouncingIcons}>
          <div className={`${styles.iconWrapper} ${styles.primary} ${styles.delay1}`}>
            <Stethoscope size={32} />
          </div>
          <div className={`${styles.iconWrapper} ${styles.secondary} ${styles.delay2}`}>
            <User size={32} />
          </div>
          <div className={`${styles.iconWrapper} ${styles.tertiary} ${styles.delay3}`}>
            <Calendar size={32} />
          </div>
          <div className={`${styles.iconWrapper} ${styles.quaternary} ${styles.delay4}`}>
            <Shield size={32} />
          </div>
        </div>
        {renderAnimatedMessage()}
      </div>
    );
  }

  // Renderizar ícono del rol actual saltando
  const roleIconMap = {
    'Médico': Stethoscope,
    'Paciente': User,
    'Secretario': Calendar,
    'Administrador': Shield
  };

  const RoleIcon = roleIconMap[role] || Stethoscope;
  const iconSize = size === 'small' ? 24 : size === 'large' ? 48 : 36;

  return (
    <div className={styles.container}>
      <div className={`${styles.bouncingRole} ${styles[colorClass]} ${styles[size]}`}>
        {customIcon ? (
          <div className={styles.customIconWrapper}>
            {customIcon}
          </div>
        ) : (
          <RoleIcon size={iconSize} />
        )}
      </div>
      {renderAnimatedMessage()}
    </div>
  );
};
