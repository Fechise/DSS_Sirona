import React from 'react';
import styles from './RoleSelector.module.scss';

export interface RoleSelectorProps {
  selectedRole: 'Médico' | 'Paciente' | 'Secretario' | 'Administrador';
  onRoleChange: (role: 'Médico' | 'Paciente' | 'Secretario' | 'Administrador') => void;
}

const roles: Array<'Médico' | 'Paciente' | 'Secretario' | 'Administrador'> = [
  'Médico',
  'Paciente',
  'Secretario',
  'Administrador',
];

export const RoleSelector: React.FC<RoleSelectorProps> = ({ selectedRole, onRoleChange }) => {
  return (
    <div className={styles.container}>
      <label className={styles.label}>Selecciona tu rol:</label>
      <div className={styles.rolesGrid}>
        {roles.map((role) => (
          <button
            key={role}
            type="button"
            className={[styles.roleButton, selectedRole === role ? styles.active : ''].join(' ')}
            onClick={() => onRoleChange(role)}
            data-role={role}
          >
            {role}
          </button>
        ))}
      </div>
    </div>
  );
};
