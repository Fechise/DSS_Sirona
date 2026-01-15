import React from 'react';
import { Edit, Save, X } from 'lucide-react';
import { Button } from '../../../atoms/Button/Button';
import styles from '../PatientRecordPage.module.scss';

type MedsSectionProps = {
  medicamentos: string[];
  alergias: string[];
  isEditing: boolean;
  formData: { medicamentos: string; alergias: string };
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onChange: (field: 'medicamentos' | 'alergias', value: string) => void;
};

export const MedicationsSection: React.FC<MedsSectionProps> = ({
  medicamentos,
  alergias,
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
        <h2>Medicación y Alergias</h2>
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
            <label>Medicamentos</label>
            <div className={styles.fieldValue}>{medicamentos.join('\n')}</div>
          </div>
          <div className={styles.field}>
            <label>Alergias</label>
            <div className={styles.fieldValue}>{alergias.join('\n')}</div>
          </div>
        </>
      ) : (
        <>
          <div className={styles.field}>
            <label htmlFor="meds">Medicamentos (uno por línea)</label>
            <textarea
              id="meds"
              className={styles.textarea}
              rows={3}
              value={formData.medicamentos}
              onChange={(e) => onChange('medicamentos', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="alerg">Alergias (uno por línea)</label>
            <textarea
              id="alerg"
              className={styles.textarea}
              rows={3}
              value={formData.alergias}
              onChange={(e) => onChange('alergias', e.target.value)}
            />
          </div>
        </>
      )}
    </div>
  );
};
