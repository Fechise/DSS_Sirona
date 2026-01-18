import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './GeneralSection.module.scss';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { User, Mail, Shield, Calendar } from 'lucide-react';

export const GeneralSection: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  // Formatear fecha de creación si está disponible
  const getMemberSince = () => {
    // Por ahora mockeado, en el futuro vendrá del campo createdAt
    return 'Enero 2024';
  };

  const getStatusLabel = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVO':
        return 'Activo';
      case 'INACTIVO':
        return 'Inactivo';
      case 'BLOQUEADO':
        return 'Bloqueado';
      case 'PENDIENTE_VERIFICACION':
        return 'Pendiente Verificación';
      default:
        return 'Activo';
    }
  };

  const getColorByRole = (): 'primary' | 'secondary' | 'tertiary' | 'quaternary' => {
    switch (user?.role) {
      case 'Médico':
        return 'primary';
      case 'Paciente':
        return 'secondary';
      case 'Secretario':
        return 'tertiary';
      case 'Administrador':
        return 'quaternary';
      default:
        return 'secondary';
    }
  };

  const roleColor = getColorByRole();

  return (
    <div className={`${styles.section} ${styles[roleColor]}`}>
      <div className={styles.header}>
        <h2>Información General</h2>
        <p className={styles.subtitle}>
          Gestiona la información de tu perfil
        </p>
      </div>

      <div className={styles.card}>
        <div className={styles.avatarSection}>
          <Avatar size="large" color={roleColor} />
          <div className={styles.userInfo}>
            <h3>{user.fullName}</h3>
            <div className={styles.roleBadge}>
              <Shield size={14} />
              <span>{user.role}</span>
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
            <div className={styles.infoValue}>{user.email}</div>
          </div>

          {user.cedula && (
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>
                <User size={18} />
                <span>Cédula</span>
              </div>
              <div className={styles.infoValue}>{user.cedula}</div>
            </div>
          )}

          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>
              <Shield size={18} />
              <span>Rol</span>
            </div>
            <div className={styles.infoValue}>{user.role}</div>
          </div>

          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>
              <User size={18} />
              <span>Estado</span>
            </div>
            <div className={styles.infoValue}>
              <span className={styles.statusBadge}>{getStatusLabel(user.status)}</span>
            </div>
          </div>

          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>
              <Calendar size={18} />
              <span>Miembro desde</span>
            </div>
            <div className={styles.infoValue}>{getMemberSince()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
