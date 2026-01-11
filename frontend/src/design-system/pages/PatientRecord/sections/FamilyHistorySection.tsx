import React from 'react';
import styles from '../PatientRecordPage.module.scss';

type AntecedentesFamiliaresSectionProps = {
  antecedentesFamiliares: string[];
};

export const FamilyHistorySection: React.FC<AntecedentesFamiliaresSectionProps> = ({
  antecedentesFamiliares,
}) => {
  return (
    <div className={styles.recordCard}>
      <div className={styles.cardHeader}>
        <h2>Antecedentes Familiares</h2>
      </div>
      <div className={styles.field}>
        <div className={styles.fieldValue}>{antecedentesFamiliares.join('\n')}</div>
      </div>
    </div>
  );
};
