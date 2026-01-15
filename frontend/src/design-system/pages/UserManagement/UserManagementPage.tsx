import React, { useState, useEffect } from 'react';
import styles from './UserManagementPage.module.scss';
import { Container } from '../../atoms/Container/Container';
import { Users, RefreshCw } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { Table, type TableColumn } from '../../molecules/Table/Table';
import { PageHeader } from '../../molecules/PageHeader/PageHeader';
import type { User, UserRole } from '../../../types/user';
import { ALL_ROLES } from '../../../types/user';

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  // Cargar usuarios (mock por ahora, luego integrar con backend)
  const loadUsers = async () => {
    setLoading(true);
    try {
      // TODO: Integrar con FastAPI (GET /api/admin/users)
      // const res = await fetch('/api/admin/users', {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      // const data = await res.json();
      // setUsers(data.users);
      
      // Mock data
      await new Promise((r) => setTimeout(r, 600));
      setUsers([
        { id: '1', fullName: 'Juan Pérez', email: 'juan@sirona.local', role: 'Médico', status: 'Activo' },
        { id: '2', fullName: 'María González', email: 'maria@sirona.local', role: 'Paciente', status: 'Activo' },
        { id: '3', fullName: 'Carlos Ruiz', email: 'carlos@sirona.local', role: 'Secretario', status: 'Activo' },
        { id: '4', fullName: 'Ana López', email: 'ana@sirona.local', role: 'Médico', status: 'Activo' },
        { id: '5', fullName: 'Demo User', email: 'demo@sirona.local', role: 'Paciente', status: 'Activo' },
      ]);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdating(userId);
    try {
      // TODO: Integrar con FastAPI (PATCH /api/admin/users/{userId}/role)
      // await fetch(`/api/admin/users/${userId}/role`, {
      //   method: 'PATCH',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`
      //   },
      //   body: JSON.stringify({ role: newRole })
      // });
      
      // Mock: actualizar localmente
      await new Promise((r) => setTimeout(r, 400));
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
    } catch (error) {
      console.error('Error updating role:', error);
    } finally {
      setUpdating(null);
    }
  };

  // Definir columnas de la tabla
  const columns: TableColumn<User>[] = [
    {
      key: 'fullName',
      label: 'Nombre',
    },
    {
      key: 'email',
      label: 'Correo',
    },
    {
      key: 'role',
      label: 'Rol Actual',
      render: (value: UserRole) => (
        <span className={[styles.roleBadge, styles[`role${value}`]].join(' ')}>
          {value}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (value: string) => (
        <span className={[styles.statusBadge, styles[`status${value}`]].join(' ')}>
          {value}
        </span>
      ),
    },
    {
      key: 'id',
      label: 'Acciones',
      render: (_value: string, user: User) => (
        <select
          className={styles.roleSelect}
          value={user.role}
          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
          disabled={updating === user.id}
        >
          {ALL_ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      ),
    },
  ];

  return (
    <Container>
      <main className={styles.main}>
        <PageHeader
          title="Gestión de Usuarios"
          icon={<Users size={32} />}
        />

        <div className={styles.headerActions}>
          <p className={styles.subtitle}>
            Administra los roles y permisos de los usuarios del sistema
          </p>
          <Button
            variant="filled"
            color="secondary"
            onClick={loadUsers}
            disabled={loading}
            startIcon={<RefreshCw size={16} />}
          >
            Actualizar
          </Button>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <RefreshCw size={32} className={styles.spinner} />
            <p>Cargando usuarios...</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <Table<User>
              columns={columns}
              data={users}
              emptyMessage="No se encontraron usuarios"
            />
          </div>
        )}
      </main>
    </Container>
  );
};
