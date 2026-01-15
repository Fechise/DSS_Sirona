import React from 'react';
import styles from '../PatientRecordPage.module.scss';

type RevisionSistemasSectionProps = {
  revisionSistemas: { sistema: string; hallazgos: string }[];
};

export const SystemsReviewSection: React.FC<RevisionSistemasSectionProps> = ({ revisionSistemas }) => {
  return (
    <div className={styles.recordCard}>
      <div className={styles.cardHeader}>
        <h2>Revisión por Sistemas</h2>
      </div>
      {revisionSistemas.map((item, idx) => (
        <div className={styles.field} key={idx}>
          <label>{item.sistema}</label>
          <div className={styles.fieldValue}>{item.hallazgos}</div>
        </div>
      ))}
    </div>
  );
};
