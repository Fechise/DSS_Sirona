import React from 'react';
import styles from '../PatientRecordPage.module.scss';

type Laboratorio = {
  prueba: string;
  valor: string;
  unidad?: string;
  referencia?: string;
  fecha: string;
};

type LaboratoriosSectionProps = {
  laboratorios: Laboratorio[];
};

export const LaboratorySection: React.FC<LaboratoriosSectionProps> = ({ laboratorios }) => {
  return (
    <div className={styles.recordCard}>
      <div className={styles.cardHeader}>
        <h2>Laboratorios</h2>
      </div>
      {laboratorios.map((lab, idx) => (
        <div className={styles.field} key={idx}>
          <label>
            {lab.prueba} ({lab.fecha})
          </label>
          <div className={styles.fieldValue}>
            {lab.valor}
            {lab.unidad ? ` ${lab.unidad}` : ''}
            {lab.referencia ? ` (Ref: ${lab.referencia})` : ''}
          </div>
        </div>
      ))}
    </div>
  );
};
