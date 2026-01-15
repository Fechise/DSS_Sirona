import React from 'react';
import styles from './BackgroundBlobs.module.scss';

export const BackgroundBlobs: React.FC = () => {
  return (
    <div className={styles.blobsContainer}>
      <div className={`${styles.blob} ${styles.blob1}`} />
      <div className={`${styles.blob} ${styles.blob2}`} />
      <div className={`${styles.blob} ${styles.blob3}`} />
      <div className={`${styles.blob} ${styles.blob4}`} />
    </div>
  );
};
