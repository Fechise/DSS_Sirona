import React, { useState, useEffect } from 'react';
import styles from './UserManagementPage.module.scss';
import { Container } from '../../atoms/Container/Container';
import { Badge } from '../../atoms/Badge/Badge';
import { Users, RefreshCw, AlertCircle, Edit2, CheckCircle, Trash2, Plus, Loader2 } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { Modal } from '../../atoms/Modal/Modal';
import { LoadingSpinner } from '../../atoms/LoadingSpinner/LoadingSpinner';
import { Table, type TableColumn } from '../../molecules/Table/Table';
import { PageHeader } from '../../molecules/PageHeader/PageHeader';
import { TableToolbar } from '../../molecules/TableToolbar/TableToolbar';
import { Input } from '../../atoms/Input/Input';
import type { UserRole, UserStatus } from '../../../types/user';
import { useAuth } from '../../../contexts/AuthContext';
import { AdminApiService, type UserListItem } from '../../../services/api';

// Todos los estados disponibles
const ALL_STATUSES: UserStatus[] = ['Activo', 'Inactivo', 'Bloqueado'];

// Formulario de creación/edición de usuario (Solo Secretarios)
interface UserForm {
  fullName: string;
  email: string;
  cedula: string;
  departamento: string;
}

export const UserManagementPage: React.FC = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Estados de creación/edición
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  
  // Formularios
  const [createForm, setCreateForm] = useState<UserForm>({
    fullName: '',
    email: '',
    cedula: '',
    departamento: '',
  });
  
  const [editForm, setEditForm] = useState<Partial<UserForm>>({});

  const loadUsers = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const data = await AdminApiService.listUsers(token, {
        status: statusFilter || undefined,
        search: searchTerm || undefined,
      });
      setUsers(data.users as UserListItem[]);
    } catch (err: unknown) {
      const apiError = err as { detail?: string };
      setError(apiError?.detail || 'Error al cargar secretarios');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadUsers();
  };

  const handleCreateFormChange = (field: keyof UserForm) => (value: string) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditFormChange = (field: keyof UserForm) => (value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCreating(true);
    setError(null);

    try {
      await AdminApiService.createUser(token, createForm);
      setSuccess('Secretario creado exitosamente. La contraseña temporal ha sido enviada por email.');
      setShowCreateModal(false);
      setCreateForm({
        fullName: '',
        email: '',
        cedula: '',
        departamento: '',
      });
      loadUsers();
    } catch (err: unknown) {
      const apiError = err as { detail?: string };
      setError(apiError?.detail || 'Error al crear secretario');
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (user: UserListItem) => {
    setEditingUser(user);
    setEditForm({
      fullName: user.fullName,
      email: user.email,
      cedula: user.cedula || '',
      departamento: user.departamento || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !token) return;
    
    setSaving(true);
    setError(null);

    try {
      await AdminApiService.updateUser(token, editingUser.id, editForm);
      setSuccess('Secretario actualizado exitosamente');
      setShowEditModal(false);
      setEditingUser(null);
      setEditForm({});
      loadUsers();
    } catch (err: unknown) {
      const apiError = err as { detail?: string };
      setError(apiError?.detail || 'Error al actualizar secretario');
    } finally {
      setSaving(false);
    }
  };

  const handleReactivateUser = async (userId: string) => {
    if (!token) return;
    setUpdating(userId);
    setError(null);

    try {
      await AdminApiService.reactivateUser(token, userId);
      setSuccess('Secretario reactivado exitosamente');
      loadUsers();
    } catch (err: unknown) {
      const apiError = err as { detail?: string };
      setError(apiError?.detail || 'Error al reactivar secretario');
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Está seguro de desactivar este secretario?')) return;
    if (!token) return;
    
    setUpdating(userId);
    setError(null);

    try {
      await AdminApiService.deactivateUser(token, userId);
      setSuccess('Secretario desactivado exitosamente');
      loadUsers();
    } catch (err: unknown) {
      const apiError = err as { detail?: string };
      setError(apiError?.detail || 'Error al desactivar secretario');
    } finally {
      setUpdating(null);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [token, statusFilter]);

  // Definir columnas de la tabla
  const columns: TableColumn<UserListItem>[] = [
    {
      key: 'fullName',
      label: 'Nombre',
      render: (_, row) => (
        <div className={styles.userInfo}>
          <strong>{row.fullName}</strong>
          <span className={styles.email}>{row.email}</span>
        </div>
      ),
    },
    {
      key: 'id',
      label: 'Cédula',
      render: (_, row) => row.cedula || 'N/A',
    },
    {
      key: 'role',
      label: 'Rol',
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
      render: (_value: string, user: UserListItem) => (
        <div className={styles.actionsCell}>
          <Button
            variant="ghost"
            color="primary"
            onClick={() => openEditModal(user)}
            disabled={updating === user.id}
            aria-label="Editar usuario"
          >
            <Edit2 size={18} />
          </Button>
          {user.status === 'Inactivo' || user.status === 'Bloqueado' ? (
            <Button
              variant="ghost"
              color="tertiary"
              onClick={() => handleReactivateUser(user.id)}
              disabled={updating === user.id}
              aria-label="Reactivar usuario"
            >
              <CheckCircle size={18} />
            </Button>
          ) : (
            <Button
              variant="ghost"
              color="error"
              onClick={() => handleDeleteUser(user.id)}
              disabled={updating === user.id}
              aria-label="Desactivar usuario"
            >
              <Trash2 size={18} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Container>
      <main className={styles.main}>
        <PageHeader
          title="Gestión de Secretarios"
          icon={<Users size={32} />}
          subtitle="Administra los secretarios del sistema"
        />

        <TableToolbar
          right={
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button
                variant="filled"
                color="primary"
                onClick={() => setShowCreateModal(true)}
                startIcon={<Plus size={16} />}
              >
                Crear Secretario
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={loadUsers}
                disabled={loading}
                startIcon={<RefreshCw size={16} />}
              >
                Actualizar
              </Button>
            </div>
          }
        />

        {/* Filters */}
        <div className={styles.filters}>
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos los estados</option>
            {ALL_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <div className={styles.searchGroup}>
            <Input
              id="search-users"
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(value) => setSearchTerm(value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button variant="filled" color="primary" onClick={handleSearch}>
              Buscar
            </Button>
          </div>
        </div>

        {/* Messages */}
        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}

        {loading ? (
          <LoadingSpinner
            variant="bouncing-role"
            role="Administrador"
            message="Cargando secretarios..."
            size="large"
          />
        ) : (
          <div className={styles.tableContainer}>
            <Table<UserListItem>
              columns={columns}
              data={users}
              emptyMessage="No se encontraron usuarios"
              rowKey="id"
            />
          </div>
        )}

        {/* Create User Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Crear Nuevo Usuario"
        >
          <form className={styles.createForm} onSubmit={handleCreateUser}>
            <div className={styles.formGroup}>
              <Input
                id="create-fullName"
                label="Nombre Completo"
                type="text"
                value={createForm.fullName}
                onChange={handleCreateFormChange('fullName')}
              />
            </div>
            <div className={styles.formGroup}>
              <Input
                id="create-email"
                label="Correo Electrónico"
                type="email"
                value={createForm.email}
                onChange={handleCreateFormChange('email')}
              />
            </div>
            <div className={styles.formGroup}>
              <Input
                id="create-cedula"
                label="Cédula"
                type="text"
                value={createForm.cedula}
                onChange={handleCreateFormChange('cedula')}
              />
            </div>
            <div className={styles.formGroup}>
              <Input
                id="create-departamento"
                label="Departamento"
                type="text"
                value={createForm.departamento}
                onChange={handleCreateFormChange('departamento')}
              />
            </div>

            <div className={styles.infoNote}>
              <AlertCircle size={20} />
              <p>
                <strong>Nota:</strong> Se generará una contraseña temporal que será enviada 
                al correo electrónico del secretario. Se recomienda cambiarla en el primer inicio de sesión.
              </p>
            </div>

            <div className={styles.formActions}>
              <Button
                type="button"
                variant="outlined"
                color="secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="filled"
                color="primary"
                disabled={creating}
                startIcon={creating ? <Loader2 size={16} className={styles.spinner} /> : <Plus size={16} />}
              >
                {creating ? 'Creando...' : 'Crear Secretario'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit User Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Editar Secretario"
        >
          <form className={styles.createForm} onSubmit={handleSaveEdit}>
            <div className={styles.formGroup}>
              <Input
                id="edit-fullName"
                label="Nombre Completo"
                type="text"
                value={editForm.fullName || ''}
                onChange={handleEditFormChange('fullName')}
              />
            </div>
            <div className={styles.formGroup}>
              <Input
                id="edit-email"
                label="Correo Electrónico"
                type="email"
                value={editForm.email || ''}
                onChange={handleEditFormChange('email')}
              />
            </div>
            <div className={styles.formGroup}>
              <Input
                id="edit-departamento"
                label="Departamento"
                type="text"
                value={editForm.departamento || ''}
                onChange={handleEditFormChange('departamento')}
              />
            </div>

            <div className={styles.formActions}>
              <Button
                type="button"
                variant="outlined"
                color="secondary"
                onClick={() => setShowEditModal(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="filled"
                color="primary"
                disabled={saving}
                startIcon={saving ? <Loader2 size={16} className={styles.spinner} /> : <Edit2 size={16} />}
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </Modal>
      </main>
    </Container>
  );
};
