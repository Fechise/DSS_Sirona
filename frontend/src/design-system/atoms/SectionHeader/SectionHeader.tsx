import React from 'react';
import styles from './SectionHeader.module.scss';

type SectionHeaderProps = {
  title: string;
  icon?: React.ReactNode;
  level?: 'h2' | 'h3';
  className?: string;
};

export const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  title, 
  icon, 
  level = 'h2',
  className = '' 
}) => {
  const Tag = level;

  return (
    <div className={`${styles.header} ${className}`.trim()}>
      <Tag className={styles.title}>
        {icon && <span className={styles.icon}>{icon}</span>}
        {title}
      </Tag>
    </div>
  );
};
