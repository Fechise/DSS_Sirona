import React from 'react';
import styles from '../PatientRecordPage.module.scss';

type Seguimiento = {
  fecha: string;
  instrucciones: string;
};

type SeguimientoSectionProps = {
  seguimiento?: Seguimiento;
  formatDate: (iso: string) => string;
};

export const FollowUpSection: React.FC<SeguimientoSectionProps> = ({ seguimiento, formatDate }) => {
  if (!seguimiento) return null;

  return (
    <div className={styles.recordCard}>
      <div className={styles.cardHeader}>
        <h2>Seguimiento</h2>
      </div>
      <div className={styles.field}>
        <label>Próxima cita</label>
        <div className={styles.fieldValue}>{formatDate(seguimiento.fecha)}</div>
      </div>
      <div className={styles.field}>
        <label>Indicaciones</label>
        <div className={styles.fieldValue}>{seguimiento.instrucciones}</div>
      </div>
    </div>
  );
};
