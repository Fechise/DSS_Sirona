import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './ProfileSidebar.module.scss';
import { User, KeyRound } from 'lucide-react';

export type ProfileSection = 'general' | 'security';

type ProfileSidebarProps = {
  /**
   * Sección actual activa
   */
  activeSection: ProfileSection;

  /**
   * Callback cuando se selecciona una sección
   */
  onSelectSection: (section: ProfileSection) => void;
};

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  activeSection,
  onSelectSection,
}) => {
  const { user } = useAuth();

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

  const menuItems: Array<{ id: ProfileSection; label: string; icon: React.ReactNode }> = [
    { id: 'general', label: 'General', icon: <User size={20} /> },
    { id: 'security', label: 'Seguridad', icon: <KeyRound size={20} /> },
  ];

  return (
    <aside className={`${styles.sidebar} ${styles[roleColor]}`}>
      <nav className={styles.nav}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`${styles.navItem} ${activeSection === item.id ? styles.active : ''}`}
            onClick={() => onSelectSection(item.id)}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};
