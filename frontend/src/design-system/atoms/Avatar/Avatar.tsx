import React from 'react';
import styles from './Avatar.module.scss';
import { User } from 'lucide-react';

export type AvatarSize = 'small' | 'medium' | 'large';

export type AvatarProps = {
  /**
   * URL de la imagen del avatar (opcional)
   */
  src?: string;
  
  /**
   * Iniciales para mostrar (opcional, se muestra si no hay src)
   */
  initials?: string;
  
  /**
   * Tamaño del avatar
   */
  size?: AvatarSize;
  
  /**
   * Color personalizado para el gradiente (opcional)
   */
  customColor?: string;
  
  /**
   * Mostrar ícono de usuario por defecto si no hay src ni initials
   */
  showIcon?: boolean;
  
  /**
   * Clase CSS adicional
   */
  className?: string;
  
  /**
   * Alt text para la imagen
   */
  alt?: string;
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  initials,
  size = 'medium',
  customColor,
  showIcon = true,
  className = '',
  alt = 'Avatar',
}) => {
  const sizeClass = styles[size];
  const customStyle = customColor ? { background: customColor } : undefined;

  // Si hay imagen, mostrarla
  if (src) {
    return (
      <div className={`${styles.avatar} ${sizeClass} ${className}`}>
        <img src={src} alt={alt} className={styles.image} />
      </div>
    );
  }

  // Si hay iniciales, mostrarlas
  if (initials) {
    return (
      <div 
        className={`${styles.avatar} ${sizeClass} ${styles.withContent} ${className}`}
        style={customStyle}
      >
        <span className={styles.initials}>{initials}</span>
      </div>
    );
  }

  // Por defecto, mostrar ícono de usuario
  if (showIcon) {
    return (
      <div 
        className={`${styles.avatar} ${sizeClass} ${styles.withContent} ${className}`}
        style={customStyle}
      >
        <User className={styles.icon} />
      </div>
    );
  }

  // Fallback: avatar vacío
  return (
    <div 
      className={`${styles.avatar} ${sizeClass} ${styles.withContent} ${className}`}
      style={customStyle}
    />
  );
};
