import React from 'react';
import styles from './Header.module.scss';
import { ShieldCheck, LogOut, User, Users, Clipboard, ChevronDown, Home, FileText, Calendar } from 'lucide-react';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { NavItem } from '../../atoms/NavItem/NavItem';
import { DropdownMenu, type DropdownMenuItem } from '../../atoms/DropdownMenu/DropdownMenu';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfile = () => {
    navigate('/perfil');
  };

  const isActive = (path: string) => location.pathname === path;

  const getRoleColor = (): 'primary' | 'secondary' | 'tertiary' | 'quaternary' => {
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
        return 'primary';
    }
  };

  const getNavItems = () => {
    const items = [
      {
        id: 'home',
        icon: <Home size={18} />,
        label: 'Inicio',
        path: '/inicio',
      },
    ];

    switch (user?.role) {
      case 'Médico':
        items.push({
          id: 'patients',
          icon: <Clipboard size={18} />,
          label: 'Mis Pacientes',
          path: '/medico/pacientes',
        });
        items.push({
          id: 'availability',
          icon: <Calendar size={18} />,
          label: 'Mi Disponibilidad',
          path: '/medico/disponibilidad',
        });
        items.push({
          id: 'appointments',
          icon: <Calendar size={18} />,
          label: 'Mis Citas',
          path: '/medico/citas',
        });
        break;
      case 'Administrador':
        items.push({
          id: 'users',
          icon: <Users size={18} />,
          label: 'Gestión de Usuarios',
          path: '/admin/usuarios',
        });
        items.push({
          id: 'audit-logs',
          icon: <FileText size={18} />,
          label: 'Logs de Auditoría',
          path: '/admin/logs',
        });
        break;
      case 'Paciente':
        items.push({
          id: 'history',
          icon: <FileText size={18} />,
          label: 'Mi Historial',
          path: '/paciente/mi-historial',
        });
        items.push({
          id: 'appointments',
          icon: <Calendar size={18} />,
          label: 'Mis Citas',
          path: '/paciente/mis-citas',
        });
        break;
      case 'Secretario':
        items.push({
          id: 'register-user',
          icon: <Users size={18} />,
          label: 'Registro de Usuarios',
          path: '/secretario/registro-usuario',
        });
        items.push({
          id: 'appointments',
          icon: <Calendar size={18} />,
          label: 'Agendamiento',
          path: '/secretario/citas',
        });
        items.push({
          id: 'patients-list',
          icon: <Users size={18} />,
          label: 'Listado de Pacientes',
          path: '/secretario/pacientes',
        });
        break;
    }

    return items;
  };

  const navItems = getNavItems();
  const roleColor = getRoleColor();

  const menuItems: DropdownMenuItem[] = [
    {
      id: 'profile',
      icon: <User size={18} />,
      label: 'Ver Perfil',
      onClick: handleProfile,
    },
    {
      id: 'logout',
      icon: <LogOut size={18} />,
      label: 'Cerrar Sesión',
      onClick: handleLogout,
      variant: 'danger',
    },
  ];

  const triggerContent = (
    <button className={styles.profileButton}>
      <div className={styles.avatarWrapper}>
        <Avatar size="medium" color={roleColor} />
      </div>
      <span className={styles.userName}>{user?.email}</span>
      <ChevronDown size={16} className={styles.chevron} />
    </button>
  );

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.brandIcon} aria-hidden>
          <ShieldCheck size={24} />
        </span>
        <span className={styles.brandText}>Sirona</span>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={isActive(item.path)}
            onClick={() => navigate(item.path)}
            color={roleColor}
          />
        ))}
      </nav>

      <div className={styles.userInfo}>
        <DropdownMenu
          trigger={triggerContent}
          items={menuItems}
          color={roleColor}
          position="right"
          showDividers={true}
        />
      </div>
    </header>
  );
};