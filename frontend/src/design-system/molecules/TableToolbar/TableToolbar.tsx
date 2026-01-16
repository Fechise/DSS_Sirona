import React, { type ReactNode } from 'react';
import styles from './TableToolbar.module.scss';

export type TableToolbarProps = {
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
};

export const TableToolbar: React.FC<TableToolbarProps> = ({ left, right, className }) => {
  return (
    <div className={[styles.container, className].filter(Boolean).join(' ')}>
      <div className={styles.left}>{left}</div>
      <div className={styles.right}>{right}</div>
    </div>
  );
};
