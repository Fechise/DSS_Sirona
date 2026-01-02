import React, { useState, useEffect } from 'react';
import styles from './UserManagementPage.module.scss';
import { Container } from '../../atoms/Container/Container';
import { Header } from '../../organisms/Header/Header';
import { Users, RefreshCw } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
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

  return (
    <Container>
      <Header />
      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <div className={styles.titleGroup}>
              <Users size={28} />
              <h1>Gestión de Usuarios</h1>
            </div>
            <Button
              variant="secondary"
              onClick={loadUsers}
              disabled={loading}
              startIcon={<RefreshCw size={16} />}
            >
              Actualizar
            </Button>
          </div>
          <p className={styles.subtitle}>
            Administra los roles y permisos de los usuarios del sistema
          </p>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <RefreshCw size={32} className={styles.spinner} />
            <p>Cargando usuarios...</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol Actual</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.fullName}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={[styles.roleBadge, styles[`role${user.role}`]].join(' ')}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={[styles.statusBadge, styles[`status${user.status}`]].join(' ')}>
                        {user.status}
                      </span>
                    </td>
                    <td>
                      <select
                        className={styles.roleSelect}
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(user.id, e.target.value as UserRole)
                        }
                        disabled={updating === user.id}
                      >
                        {ALL_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && users.length === 0 && (
          <div className={styles.emptyState}>
            <Users size={48} />
            <p>No se encontraron usuarios</p>
          </div>
        )}
      </main>
    </Container>
  );
};
