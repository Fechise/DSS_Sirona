import React from 'react';
import { Edit, Save, X } from 'lucide-react';
import { Button } from '../../../atoms/Button/Button';
import styles from '../PatientRecordPage.module.scss';

type EvalSectionProps = {
  diagnostico: string;
  tratamiento: string;
  observaciones: string;
  ultimaModificacion: string;
  isEditing: boolean;
  formData: { diagnostico: string; tratamiento: string; observaciones: string };
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onChange: (field: 'diagnostico' | 'tratamiento' | 'observaciones', value: string) => void;
  formatDate: (iso: string) => string;
};

export const EvaluationSection: React.FC<EvalSectionProps> = ({
  diagnostico,
  tratamiento,
  observaciones,
  ultimaModificacion,
  isEditing,
  formData,
  onEdit,
  onCancel,
  onSave,
  onChange,
  formatDate,
}) => {
  return (
    <div className={styles.recordCard}>
      <div className={styles.cardHeader}>
        <h2>Evaluación y Plan</h2>
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
            <label>Diagnóstico</label>
            <div className={styles.fieldValue}>{diagnostico}</div>
          </div>
          <div className={styles.field}>
            <label>Plan / Tratamiento</label>
            <div className={styles.fieldValue}>{tratamiento}</div>
          </div>
          <div className={styles.field}>
            <label>Observaciones</label>
            <div className={styles.fieldValue}>{observaciones}</div>
          </div>
          <div className={styles.metadata}>Última modificación: {formatDate(ultimaModificacion)}</div>
        </>
      ) : (
        <>
          <div className={styles.field}>
            <label htmlFor="diag">Diagnóstico</label>
            <textarea
              id="diag"
              className={styles.textarea}
              rows={3}
              value={formData.diagnostico}
              onChange={(e) => onChange('diagnostico', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="plan">Plan / Tratamiento</label>
            <textarea
              id="plan"
              className={styles.textarea}
              rows={3}
              value={formData.tratamiento}
              onChange={(e) => onChange('tratamiento', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="obs">Observaciones</label>
            <textarea
              id="obs"
              className={styles.textarea}
              rows={4}
              value={formData.observaciones}
              onChange={(e) => onChange('observaciones', e.target.value)}
            />
          </div>
        </>
      )}
    </div>
  );
};
