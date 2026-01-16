import React, { useState, useEffect } from 'react';
import styles from './UserManagementPage.module.scss';
import { Container } from '../../atoms/Container/Container';
<<<<<<< HEAD
import { Users, RefreshCw, Plus, Trash2, Loader2, Edit2, CheckCircle } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { Input } from '../../atoms/Input/Input';
import { Modal } from '../../atoms/Modal/Modal';
import { Table, type TableColumn } from '../../molecules/Table/Table';
import { PageHeader } from '../../molecules/PageHeader/PageHeader';
import { PasswordStrengthIndicator } from '../../molecules/PasswordStrengthIndicator/PasswordStrengthIndicator';
import { useAuth } from '../../../contexts/AuthContext';
import { AdminApiService, type UserListItem, type CreateUserRequest, type UpdateUserRequest } from '../../../services/api';

const ALL_ROLES = ['Administrador', 'Médico', 'Paciente', 'Secretario'] as const;
const ALL_STATUSES = ['Activo', 'Inactivo', 'Bloqueado'] as const;
=======
import { Badge } from '../../atoms/Badge/Badge';
import { Users, RefreshCw, AlertCircle, Pencil } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { Modal } from '../../atoms/Modal/Modal';
import { Table, type TableColumn } from '../../molecules/Table/Table';
import { PageHeader } from '../../molecules/PageHeader/PageHeader';
import { TableToolbar } from '../../molecules/TableToolbar/TableToolbar';
import type { User, UserRole } from '../../../types/user';
import { ALL_ROLES } from '../../../types/user';
>>>>>>> feature/PBI-15-20-auditoria-integridad

export const UserManagementPage: React.FC = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
<<<<<<< HEAD
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Filters
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserRequest>({
    email: '',
    password: '',
    fullName: '',
    cedula: '',
    role: 'Paciente',
    especialidad: '',
    numeroLicencia: '',
    departamento: '',
    telefonoContacto: '',
  });
  const [creating, setCreating] = useState(false);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [editForm, setEditForm] = useState<UpdateUserRequest>({});
  const [saving, setSaving] = useState(false);
=======
  const [roleChangeModal, setRoleChangeModal] = useState<{ userId: string; currentRole: UserRole } | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<UserRole | null>(null);
>>>>>>> feature/PBI-15-20-auditoria-integridad

  const loadUsers = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const data = await AdminApiService.listUsers(token, {
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        search: searchTerm || undefined,
      });
      setUsers(data.users);
    } catch (err: unknown) {
      const apiError = err as { detail?: string };
      setError(apiError?.detail || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [token, roleFilter, statusFilter]);

<<<<<<< HEAD
  const handleSearch = () => {
    loadUsers();
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!token) return;
    setUpdating(userId);
    setError(null);

    try {
      await AdminApiService.changeUserRole(token, userId, newRole);
      setSuccess('Rol actualizado correctamente');
      setTimeout(() => setSuccess(null), 3000);
      loadUsers();
    } catch (err: unknown) {
      const apiError = err as { detail?: string };
      setError(apiError?.detail || 'Error al actualizar rol');
=======
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
>>>>>>> feature/PBI-15-20-auditoria-integridad
    } finally {
      setUpdating(null);
    }
  };

<<<<<<< HEAD
  const handleDeleteUser = async (userId: string) => {
    if (!token) return;
    if (!window.confirm('¿Estás seguro de desactivar este usuario?')) return;

    setUpdating(userId);
    setError(null);

    try {
      await AdminApiService.deleteUser(token, userId);
      setSuccess('Usuario desactivado correctamente');
      setTimeout(() => setSuccess(null), 3000);
      loadUsers();
    } catch (err: unknown) {
      const apiError = err as { detail?: string };
      setError(apiError?.detail || 'Error al desactivar usuario');
    } finally {
      setUpdating(null);
    }
  };

  const handleReactivateUser = async (userId: string) => {
    if (!token) return;
    if (!window.confirm('¿Deseas reactivar este usuario?')) return;

    setUpdating(userId);
    setError(null);

    try {
      await AdminApiService.updateUser(token, userId, { status: 'Activo' });
      setSuccess('Usuario reactivado correctamente');
      setTimeout(() => setSuccess(null), 3000);
      loadUsers();
    } catch (err: unknown) {
      const apiError = err as { detail?: string };
      setError(apiError?.detail || 'Error al reactivar usuario');
    } finally {
      setUpdating(null);
    }
  };

  const openEditModal = (user: UserListItem) => {
    setEditingUser(user);
    setEditForm({
      fullName: user.fullName,
      email: user.email,
      especialidad: user.especialidad,
      numeroLicencia: user.numeroLicencia,
      departamento: user.departamento,
      telefonoContacto: user.telefonoContacto,
    });
    setShowEditModal(true);
  };

  const handleEditFormChange = (field: keyof UpdateUserRequest) => (value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingUser) return;

    setSaving(true);
    setError(null);

    try {
      await AdminApiService.updateUser(token, editingUser.id, editForm);
      setSuccess('Usuario actualizado correctamente');
      setTimeout(() => setSuccess(null), 3000);
      setShowEditModal(false);
      setEditingUser(null);
      loadUsers();
    } catch (err: unknown) {
      const apiError = err as { detail?: string | { error: string } };
      const errorMsg = typeof apiError?.detail === 'object' ? apiError.detail.error : apiError?.detail;
      setError(errorMsg || 'Error al actualizar usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateFormChange = (field: keyof CreateUserRequest) => (
    value: string
  ) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectChange = (field: keyof CreateUserRequest) => (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setCreateForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setCreating(true);
    setError(null);

    try {
      await AdminApiService.createUser(token, createForm);
      setSuccess('Usuario creado exitosamente');
      setTimeout(() => setSuccess(null), 3000);
      setShowCreateModal(false);
      setCreateForm({
        email: '',
        password: '',
        fullName: '',
        cedula: '',
        role: 'Paciente',
        especialidad: '',
        numeroLicencia: '',
        departamento: '',
        telefonoContacto: '',
      });
      loadUsers();
    } catch (err: unknown) {
      const apiError = err as { detail?: string | { error: string } };
      const errorMsg = typeof apiError?.detail === 'object' ? apiError.detail.error : apiError?.detail;
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    } finally {
      setCreating(false);
    }
  };

  const columns: TableColumn<UserListItem>[] = [
=======
  const handleOpenRoleChangeModal = (user: User) => {
    setRoleChangeModal({ userId: user.id, currentRole: user.role });
    setSelectedNewRole(user.role);
  };

  // Definir columnas de la tabla
  const columns: TableColumn<User>[] = [
>>>>>>> feature/PBI-15-20-auditoria-integridad
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
      key: 'cedula',
      label: 'Cédula',
    },
    {
      key: 'role',
      label: 'Rol Actual',
<<<<<<< HEAD
      render: (value: string) => (
        <span className={`${styles.roleBadge} ${styles[`role${value.replace('é', 'e')}`]}`}>
          {value}
        </span>
=======
      render: (value: UserRole) => (
        <Badge value={value} type="role" />
>>>>>>> feature/PBI-15-20-auditoria-integridad
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (value: string) => (
<<<<<<< HEAD
        <span className={`${styles.statusBadge} ${styles[`status${value}`]}`}>
          {value}
        </span>
=======
        <Badge value={value} type="status" />
>>>>>>> feature/PBI-15-20-auditoria-integridad
      ),
    },
    {
      key: 'id',
<<<<<<< HEAD
      label: 'Cambiar Rol',
      render: (_value: string, user: UserListItem) => (
        <select
          className={styles.roleSelect}
          value={user.role}
          onChange={(e) => handleRoleChange(user.id, e.target.value)}
          disabled={updating === user.id}
        >
          {ALL_ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
=======
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
>>>>>>> feature/PBI-15-20-auditoria-integridad
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
            title="Editar usuario"
          >
            <Edit2 size={18} />
          </Button>
          {user.status === 'Inactivo' || user.status === 'Bloqueado' ? (
            <Button
              variant="ghost"
              color="tertiary"
              onClick={() => handleReactivateUser(user.id)}
              disabled={updating === user.id}
              title="Reactivar usuario"
            >
              <CheckCircle size={18} />
            </Button>
          ) : (
            <Button
              variant="ghost"
              color="danger"
              onClick={() => handleDeleteUser(user.id)}
              disabled={updating === user.id}
              title="Desactivar usuario"
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
          title="Gestión de Usuarios"
          icon={<Users size={32} />}
          subtitle="Administra los roles y permisos de los usuarios del sistema"
        />

<<<<<<< HEAD
        <div className={styles.headerActions}>
          <p className={styles.subtitle}>
            Administra los roles y permisos de los usuarios del sistema
          </p>
          <div className={styles.actions}>
            <Button
              variant="filled"
              color="primary"
              onClick={() => setShowCreateModal(true)}
              startIcon={<Plus size={16} />}
            >
              Nuevo Usuario
            </Button>
            <Button
              variant="outlined"
=======
        <TableToolbar
          right={
            <Button
              variant="filled"
>>>>>>> feature/PBI-15-20-auditoria-integridad
              color="secondary"
              onClick={loadUsers}
              disabled={loading}
              startIcon={<RefreshCw size={16} />}
            >
              Actualizar
            </Button>
<<<<<<< HEAD
          </div>
        </div>
=======
          }
        />
>>>>>>> feature/PBI-15-20-auditoria-integridad

        {/* Filters */}
        <div className={styles.filters}>
          <select
            className={styles.filterSelect}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Todos los roles</option>
            {ALL_ROLES.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
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
          <div className={styles.loadingState}>
            <RefreshCw size={32} className={styles.spinner} />
            <p>Cargando usuarios...</p>
          </div>
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
              <label className={styles.label}>Rol</label>
              <select
                className={styles.select}
                value={createForm.role}
                onChange={handleSelectChange('role')}
              >
                {ALL_ROLES.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            {/* Role-specific fields */}
            {createForm.role === 'Médico' && (
              <>
                <div className={styles.formGroup}>
                  <Input
                    id="create-especialidad"
                    label="Especialidad"
                    type="text"
                    value={createForm.especialidad || ''}
                    onChange={handleCreateFormChange('especialidad')}
                  />
                </div>
                <div className={styles.formGroup}>
                  <Input
                    id="create-numeroLicencia"
                    label="Número de Licencia"
                    type="text"
                    value={createForm.numeroLicencia || ''}
                    onChange={handleCreateFormChange('numeroLicencia')}
                  />
                </div>
              </>
            )}

            {createForm.role === 'Secretario' && (
              <div className={styles.formGroup}>
                <Input
                  id="create-departamento"
                  label="Departamento"
                  type="text"
                  value={createForm.departamento || ''}
                  onChange={handleCreateFormChange('departamento')}
                />
              </div>
            )}

            {createForm.role === 'Paciente' && (
              <div className={styles.formGroup}>
                <Input
                  id="create-telefonoContacto"
                  label="Teléfono de Contacto"
                  type="tel"
                  value={createForm.telefonoContacto || ''}
                  onChange={handleCreateFormChange('telefonoContacto')}
                />
              </div>
            )}

            <div className={styles.formGroup}>
              <Input
                id="create-password"
                label="Contraseña"
                type="password"
                value={createForm.password}
                onChange={handleCreateFormChange('password')}
              />
              <PasswordStrengthIndicator password={createForm.password} />
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
                {creating ? 'Creando...' : 'Crear Usuario'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit User Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Editar Usuario"
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

            {/* Role-specific fields */}
            {editingUser?.role === 'Médico' && (
              <>
                <div className={styles.formGroup}>
                  <Input
                    id="edit-especialidad"
                    label="Especialidad"
                    type="text"
                    value={editForm.especialidad || ''}
                    onChange={handleEditFormChange('especialidad')}
                  />
                </div>
                <div className={styles.formGroup}>
                  <Input
                    id="edit-numeroLicencia"
                    label="Número de Licencia"
                    type="text"
                    value={editForm.numeroLicencia || ''}
                    onChange={handleEditFormChange('numeroLicencia')}
                  />
                </div>
              </>
            )}

            {editingUser?.role === 'Secretario' && (
              <div className={styles.formGroup}>
                <Input
                  id="edit-departamento"
                  label="Departamento"
                  type="text"
                  value={editForm.departamento || ''}
                  onChange={handleEditFormChange('departamento')}
                />
              </div>
            )}

            {editingUser?.role === 'Paciente' && (
              <div className={styles.formGroup}>
                <Input
                  id="edit-telefonoContacto"
                  label="Teléfono de Contacto"
                  type="tel"
                  value={editForm.telefonoContacto || ''}
                  onChange={handleEditFormChange('telefonoContacto')}
                />
              </div>
            )}

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
