import React from 'react';
import styles from './Container.module.scss';

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
};

// Contenedor neutro: solo limita ancho y centra contenido
export const Container: React.FC<ContainerProps> = ({ children, className = '' }) => {
  return (
    <div className={styles.container}>
      <div className={`${styles.content} ${className}`.trim()}>
        {children}
      </div>
    </div>
  );
};
