import React, { useState, useEffect } from 'react';
import styles from './UserManagementPage.module.scss';
import { Container } from '../../atoms/Container/Container';
import { Badge } from '../../atoms/Badge/Badge';
import { Users, RefreshCw, AlertCircle, Pencil } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { Modal } from '../../atoms/Modal/Modal';
import { Table, type TableColumn } from '../../molecules/Table/Table';
import { PageHeader } from '../../molecules/PageHeader/PageHeader';
import { TableToolbar } from '../../molecules/TableToolbar/TableToolbar';
import type { User, UserRole } from '../../../types/user';
import { ALL_ROLES } from '../../../types/user';

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [roleChangeModal, setRoleChangeModal] = useState<{ userId: string; currentRole: UserRole } | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<UserRole | null>(null);

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

  const handleRoleChangeConfirm = async () => {
    if (!roleChangeModal || !selectedNewRole) return;
    setUpdating(roleChangeModal.userId);
    try {
      await new Promise((r) => setTimeout(r, 400));
      setUsers((prev) =>
        prev.map((user) =>
          user.id === roleChangeModal.userId ? { ...user, role: selectedNewRole } : user
        )
      );
      setRoleChangeModal(null);
      setSelectedNewRole(null);
    } catch (error) {
      console.error('Error updating role:', error);
    } finally {
      setUpdating(null);
    }
  };

  const handleOpenRoleChangeModal = (user: User) => {
    setRoleChangeModal({ userId: user.id, currentRole: user.role });
    setSelectedNewRole(user.role);
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
        <Badge value={value} type="role" />
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (value: string) => (
        <Badge value={value} type="status" />
      ),
    },
    {
      key: 'id',
      label: 'Acciones',
      render: (_value: string, user: User) => (
      <Button
        variant="outlined"
        color="secondary"
        onClick={() => handleOpenRoleChangeModal(user)}
        disabled={updating === user.id}
        startIcon={<Pencil size={16} />}
      >
        Editar Rol
      </Button>
      ),
    },
  ];

  return (
    <Container>
      <main className={styles.main}>
        <PageHeader
          title="Gestión de Usuarios"
          icon={<Users size={32} />}
          subtitle="Administra los roles y permisos de los usuarios del sistema"
        />

        <TableToolbar
          right={
            <Button
              variant="filled"
              color="secondary"
              onClick={loadUsers}
              disabled={loading}
              startIcon={<RefreshCw size={16} />}
            >
              Actualizar
            </Button>
          }
        />

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

      {/* Modal de confirmación para cambio de rol */}
      <Modal
        isOpen={roleChangeModal !== null}
        onClose={() => {
          setRoleChangeModal(null);
          setSelectedNewRole(null);
        }}
        title="Cambiar Rol de Usuario"
        maxWidth="450px"
      >
        {roleChangeModal && (
          <div className={styles.modalContent}>
            <div className={styles.warningBox}>
              <AlertCircle size={24} />
              <p>Está a punto de cambiar el rol de este usuario. Esta acción puede afectar sus permisos y acceso al sistema.</p>
            </div>

            <div className={styles.roleSelection}>
              <label className={styles.selectionLabel}>Rol actual:</label>
              <Badge value={roleChangeModal.currentRole} type="role" />
            </div>

            <div className={styles.roleSelection}>
              <label htmlFor="role-select" className={styles.selectionLabel}>Nuevo rol:</label>
              <select
                id="role-select"
                className={styles.roleSelectModal}
                value={selectedNewRole || ''}
                onChange={(e) => setSelectedNewRole(e.target.value as UserRole)}
              >
                <option value="" disabled>
                  Selecciona un rol
                </option>
                {ALL_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.modalActions}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setRoleChangeModal(null);
                  setSelectedNewRole(null);
                }}
                fullWidth
              >
                Cancelar
              </Button>
              <Button
                variant="filled"
                color="primary"
                onClick={handleRoleChangeConfirm}
                disabled={!selectedNewRole || selectedNewRole === roleChangeModal.currentRole || updating === roleChangeModal.userId}
                fullWidth
              >
                {updating === roleChangeModal.userId ? 'Cambiando...' : 'Confirmar Cambio'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Container>
  );
};
