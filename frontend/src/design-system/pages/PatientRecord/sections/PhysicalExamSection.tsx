import React from 'react';
import styles from '../PatientRecordPage.module.scss';

type ExamenFisico = {
  signosVitales: {
    tensionArterial: string;
    frecuenciaCardiaca: string;
    temperatura: string;
    frecuenciaRespiratoria: string;
    saturacion: string;
  };
  hallazgos: {
    general: string;
    cardiovascular: string;
    respiratorio: string;
    abdomen: string;
    neurologico: string;
  };
};

type ExamenFisicoSectionProps = {
  examenFisico: ExamenFisico;
};

export const PhysicalExamSection: React.FC<ExamenFisicoSectionProps> = ({ examenFisico }) => {
  return (
    <div className={styles.recordCard}>
      <div className={styles.cardHeader}>
        <h2>Examen Físico</h2>
      </div>
      <div className={styles.field}>
        <label>Signos Vitales</label>
        <div className={styles.fieldValue}>
          TA: {examenFisico.signosVitales.tensionArterial}
          {'\n'}
          FC: {examenFisico.signosVitales.frecuenciaCardiaca}
          {'\n'}
          Temp: {examenFisico.signosVitales.temperatura}
          {'\n'}
          FR: {examenFisico.signosVitales.frecuenciaRespiratoria}
          {'\n'}
          SatO₂: {examenFisico.signosVitales.saturacion}
        </div>
      </div>
      <div className={styles.field}>
        <label>Hallazgos</label>
        <div className={styles.fieldValue}>
          General: {examenFisico.hallazgos.general}
          {'\n'}
          Cardiovascular: {examenFisico.hallazgos.cardiovascular}
          {'\n'}
          Respiratorio: {examenFisico.hallazgos.respiratorio}
          {'\n'}
          Abdomen: {examenFisico.hallazgos.abdomen}
          {'\n'}
          Neurológico: {examenFisico.hallazgos.neurologico}
        </div>
      </div>
    </div>
  );
};
