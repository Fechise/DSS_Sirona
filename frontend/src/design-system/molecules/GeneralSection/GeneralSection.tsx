import React from 'react';
import styles from './GeneralSection.module.scss';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { User, Mail, Shield, Calendar } from 'lucide-react';

export const GeneralSection: React.FC = () => {
  // Mock data - en el futuro vendrá del contexto/API
  const mockUser = {
    id: 'user-123',
    name: 'Roberto García',
    email: 'roberto.garcia@sirona.com',
    role: 'Médico',
    status: 'Activo',
    memberSince: 'Enero 2024',
    avatar: undefined, // Avatar mostrará las iniciales
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Administrador':
        return styles.roleAdmin;
      case 'Médico':
        return styles.roleDoctor;
      case 'Paciente':
        return styles.rolePatient;
      case 'Secretario':
        return styles.roleSecretary;
      default:
        return '';
    }
  };

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h2>Información General</h2>
        <p className={styles.subtitle}>
          Gestiona la información de tu perfil
        </p>
      </div>

      <div className={styles.card}>
        <div className={styles.avatarSection}>
          <Avatar size="large" />
          <div className={styles.userInfo}>
            <h3>{mockUser.name}</h3>
            <div
              className={`${styles.roleBadge} ${getRoleBadgeColor(mockUser.role || '')}`}
            >
              <Shield size={14} />
              <span>{mockUser.role}</span>
            </div>
          </div>
        </div>

        <div className={styles.divider}></div>

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>
              <Mail size={18} />
              <span>Correo electrónico</span>
            </div>
            <div className={styles.infoValue}>{mockUser.email}</div>
          </div>

          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>
              <Shield size={18} />
              <span>Rol</span>
            </div>
            <div className={styles.infoValue}>{mockUser.role}</div>
          </div>

          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>
              <User size={18} />
              <span>Estado</span>
            </div>
            <div className={styles.infoValue}>
              <span className={styles.statusBadge}>{mockUser.status}</span>
            </div>
          </div>

          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>
              <Calendar size={18} />
              <span>Miembro desde</span>
            </div>
            <div className={styles.infoValue}>{mockUser.memberSince}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
