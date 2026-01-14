import React from 'react';
import styles from './SectionsPatientHistory.module.scss';

type Contacto = {
  nombre: string;
  relacion: string;
  telefono: string;
};

type Medico = {
  nombre: string;
  especialidad: string;
  telefono: string;
};

type Props = {
  medicoAsignado: Medico;
  contactoEmergencia: Contacto;
};

export const ContactInfoSection: React.FC<Props> = ({ medicoAsignado, contactoEmergencia }) => {
  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Información de Contacto</h2>
        <span className={styles.badge}>Accesos</span>
      </div>

      <div className={styles.infoGrid}>
        <div className={styles.infoField}>
          <label className={styles.infoLabel}>Médico asignado</label>
          <div className={styles.infoValue}>
            <strong>{medicoAsignado.nombre}</strong>
            <span>· {medicoAsignado.especialidad}</span>
            <span>· {medicoAsignado.telefono}</span>
          </div>
        </div>
        <div className={styles.infoField}>
          <label className={styles.infoLabel}>Contacto de emergencia</label>
          <div className={styles.infoValue}>
            <strong>{contactoEmergencia.nombre}</strong>
            <span>· {contactoEmergencia.relacion}</span>
            <span>· {contactoEmergencia.telefono}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
