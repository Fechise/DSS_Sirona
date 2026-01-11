import React from 'react';
import styles from './NavItem.module.scss';

type NavItemProps = {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  color?: 'primary' | 'secondary' | 'tertiary' | 'quaternary';
};

export const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  isActive = false,
  onClick,
  color = 'primary',
}) => {
  return (
    <button
      className={`${styles.navItem} ${styles[color]} ${isActive ? styles.active : ''}`}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className={styles.icon}>{icon}</span>
      <span className={styles.label}>{label}</span>
    </button>
  );
};
