import React from 'react';
import { Edit, Save, X } from 'lucide-react';
import { Button } from '../../../atoms/Button/Button';
import styles from '../PatientRecordPage.module.scss';

type InfoSectionProps = {
  motivoConsulta: string;
  historiaEnfermedadActual: string;
  isEditing: boolean;
  formData: { motivoConsulta: string; historiaEnfermedadActual: string };
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onChange: (field: 'motivoConsulta' | 'historiaEnfermedadActual', value: string) => void;
};

export const ConsultationInfoSection: React.FC<InfoSectionProps> = ({
  motivoConsulta,
  historiaEnfermedadActual,
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
        <h2>Motivo y Evolución</h2>
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
            <label>Motivo de Consulta</label>
            <div className={styles.fieldValue}>{motivoConsulta}</div>
          </div>
          <div className={styles.field}>
            <label>Historia de la Enfermedad Actual</label>
            <div className={styles.fieldValue}>{historiaEnfermedadActual}</div>
          </div>
        </>
      ) : (
        <>
          <div className={styles.field}>
            <label htmlFor="motivo">Motivo de Consulta</label>
            <textarea
              id="motivo"
              className={styles.textarea}
              rows={3}
              value={formData.motivoConsulta}
              onChange={(e) => onChange('motivoConsulta', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="hpi">Historia de la Enfermedad Actual</label>
            <textarea
              id="hpi"
              className={styles.textarea}
              rows={4}
              value={formData.historiaEnfermedadActual}
              onChange={(e) => onChange('historiaEnfermedadActual', e.target.value)}
            />
          </div>
        </>
      )}
    </div>
  );
};
