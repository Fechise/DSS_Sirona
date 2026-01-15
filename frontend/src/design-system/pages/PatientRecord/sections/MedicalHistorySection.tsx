import React from 'react';
import { Edit, Save, X } from 'lucide-react';
import { Button } from '../../../atoms/Button/Button';
import styles from '../PatientRecordPage.module.scss';

type AntecedentesSectionProps = {
  antecedentesPersonales: string[];
  antecedentesQuirurgicos: string[];
  isEditing: boolean;
  formData: { personales: string; quirurgicos: string };
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onChange: (field: 'personales' | 'quirurgicos', value: string) => void;
};

export const MedicalHistorySection: React.FC<AntecedentesSectionProps> = ({
  antecedentesPersonales,
  antecedentesQuirurgicos,
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
        <h2>Antecedentes</h2>
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
            <label>Personales</label>
            <div className={styles.fieldValue}>{antecedentesPersonales.join('\n')}</div>
          </div>
          <div className={styles.field}>
            <label>Quirúrgicos</label>
            <div className={styles.fieldValue}>{antecedentesQuirurgicos.join('\n')}</div>
          </div>
        </>
      ) : (
        <>
          <div className={styles.field}>
            <label htmlFor="ant-pers">Personales (uno por línea)</label>
            <textarea
              id="ant-pers"
              className={styles.textarea}
              rows={3}
              value={formData.personales}
              onChange={(e) => onChange('personales', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="ant-quir">Quirúrgicos (uno por línea)</label>
            <textarea
              id="ant-quir"
              className={styles.textarea}
              rows={3}
              value={formData.quirurgicos}
              onChange={(e) => onChange('quirurgicos', e.target.value)}
            />
          </div>
        </>
      )}
    </div>
  );
};
