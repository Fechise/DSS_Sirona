import React from 'react';
import { Edit, Save, X } from 'lucide-react';
import { Button } from '../../../atoms/Button/Button';
import styles from '../PatientRecordPage.module.scss';

type HistoriaSocial = {
  tabaquismo: string;
  alcohol: string;
  ocupacion: string;
  actividadFisica: string;
};

type SocialSectionProps = {
  historiaSocial: HistoriaSocial;
  isEditing: boolean;
  formData: HistoriaSocial;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onChange: (field: keyof HistoriaSocial, value: string) => void;
};

export const SocialHistorySection: React.FC<SocialSectionProps> = ({
  historiaSocial,
  isEditing,
  formData,
  onEdit,
  onCancel,
  onSave,
  onChange,
}) => {
  return (
    <div className={styles.recordCard}>
      <div className={styles.cardHeader}>
        <h2>Historia Social</h2>
        {!isEditing ? (
          <Button variant="filled" color="primary" onClick={onEdit} startIcon={<Edit size={16} />}>
            Editar
          </Button>
        ) : (
          <div className={styles.actions}>
            <Button variant="filled" color="secondary" onClick={onCancel} startIcon={<X size={16} />}>
              Cancelar
            </Button>
            <Button variant="filled" color="primary" onClick={onSave} startIcon={<Save size={16} />}>
              Guardar
            </Button>
          </div>
        )}
      </div>
      {!isEditing ? (
        <>
          <div className={styles.field}>
            <label>Tabaquismo</label>
            <div className={styles.fieldValue}>{historiaSocial.tabaquismo}</div>
          </div>
          <div className={styles.field}>
            <label>Alcohol</label>
            <div className={styles.fieldValue}>{historiaSocial.alcohol}</div>
          </div>
          <div className={styles.field}>
            <label>Ocupación</label>
            <div className={styles.fieldValue}>{historiaSocial.ocupacion}</div>
          </div>
          <div className={styles.field}>
            <label>Actividad Física</label>
            <div className={styles.fieldValue}>{historiaSocial.actividadFisica}</div>
          </div>
        </>
      ) : (
        <>
          <div className={styles.field}>
            <label htmlFor="tabq">Tabaquismo</label>
            <textarea
              id="tabq"
              className={styles.textarea}
              rows={2}
              value={formData.tabaquismo}
              onChange={(e) => onChange('tabaquismo', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="alc">Alcohol</label>
            <textarea
              id="alc"
              className={styles.textarea}
              rows={2}
              value={formData.alcohol}
              onChange={(e) => onChange('alcohol', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="ocup">Ocupación</label>
            <textarea
              id="ocup"
              className={styles.textarea}
              rows={2}
              value={formData.ocupacion}
              onChange={(e) => onChange('ocupacion', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="actf">Actividad Física</label>
            <textarea
              id="actf"
              className={styles.textarea}
              rows={2}
              value={formData.actividadFisica}
              onChange={(e) => onChange('actividadFisica', e.target.value)}
            />
          </div>
        </>
      )}
    </div>
  );
};
