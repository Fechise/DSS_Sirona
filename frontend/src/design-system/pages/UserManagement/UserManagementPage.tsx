import React, { useState, useEffect } from 'react';
import styles from './UserManagementPage.module.scss';
import { Container } from '../../atoms/Container/Container';
import { Badge } from '../../atoms/Badge/Badge';
import { Users, RefreshCw, AlertCircle, Pencil, Edit2, CheckCircle, Trash2, Plus, Loader2 } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { Modal } from '../../atoms/Modal/Modal';
import { Table, type TableColumn } from '../../molecules/Table/Table';
import { PageHeader } from '../../molecules/PageHeader/PageHeader';
import { TableToolbar } from '../../molecules/TableToolbar/TableToolbar';
import { Input } from '../../atoms/Input/Input';
import { PasswordStrengthIndicator } from '../../molecules/PasswordStrengthIndicator/PasswordStrengthIndicator';
import type { User, UserRole, UserStatus } from '../../../types/user';
import { ALL_ROLES } from '../../../types/user';
import { useAuth } from '../../../contexts/AuthContext';

// Tipo extendido de usuario con campos adicionales para la tabla
interface UserListItem extends User {
  cedula?: string;
}

// Todos los estados disponibles
const ALL_STATUSES: UserStatus[] = ['Activo', 'Inactivo', 'Bloqueado'];

// Formulario de creación/edición de usuario
interface UserForm {
  fullName: string;
  email: string;
  cedula: string;
  role: UserRole;
  password: string;
  especialidad?: string;
  numeroLicencia?: string;
  departamento?: string;
  telefonoContacto?: string;
}

export const UserManagementPage: React.FC = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Filtros
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modales
  const [roleChangeModal, setRoleChangeModal] = useState<{ userId: string; currentRole: UserRole } | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<UserRole | null>(null);
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
    role: 'Paciente',
    password: '',
  });
  
  const [editForm, setEditForm] = useState<Partial<UserForm>>({});

  const loadUsers = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      // TODO: Implementar AdminApiService.listUsers cuando esté disponible
      // const data = await AdminApiService.listUsers(token, {
      //   role: roleFilter || undefined,
      //   status: statusFilter || undefined,
      //   search: searchTerm || undefined,
      // });
      // setUsers(data.users);
      
      // Mock data temporal
      const mockUsers: UserListItem[] = [
        {
          id: '1',
          fullName: 'Juan Pérez',
          email: 'juan@ejemplo.com',
          cedula: '1234567890',
          role: 'Médico',
          status: 'Activo',
        },
        {
          id: '2',
          fullName: 'María García',
          email: 'maria@ejemplo.com',
          cedula: '0987654321',
          role: 'Paciente',
          status: 'Activo',
        },
      ];
      setUsers(mockUsers);
    } catch (err: unknown) {
      const apiError = err as { detail?: string };
      setError(apiError?.detail || 'Error al cargar usuarios');
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

  const handleSelectChange = (field: keyof UserForm) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCreateForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      // TODO: Implementar AdminApiService.createUser cuando esté disponible
      // await AdminApiService.createUser(token, createForm);
      setSuccess('Usuario creado exitosamente');
      setShowCreateModal(false);
      setCreateForm({
        fullName: '',
        email: '',
        cedula: '',
        role: 'Paciente',
        password: '',
      });
      loadUsers();
    } catch (err: unknown) {
      const apiError = err as { detail?: string };
      setError(apiError?.detail || 'Error al crear usuario');
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (user: UserListItem) => {
    setEditingUser(user);
    setEditForm({
      fullName: user.fullName,
      email: user.email,
      especialidad: '',
      numeroLicencia: '',
      departamento: '',
      telefonoContacto: '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setSaving(true);
    setError(null);

    try {
      // TODO: Implementar AdminApiService.updateUser cuando esté disponible
      // await AdminApiService.updateUser(token, editingUser.id, editForm);
      setSuccess('Usuario actualizado exitosamente');
      setShowEditModal(false);
      setEditingUser(null);
      setEditForm({});
      loadUsers();
    } catch (err: unknown) {
      const apiError = err as { detail?: string };
      setError(apiError?.detail || 'Error al actualizar usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleReactivateUser = async (userId: string) => {
    setUpdating(userId);
    setError(null);

    try {
      // TODO: Implementar AdminApiService.reactivateUser cuando esté disponible
      // await AdminApiService.reactivateUser(token, userId);
      setSuccess('Usuario reactivado exitosamente');
      loadUsers();
    } catch (err: unknown) {
      const apiError = err as { detail?: string };
      setError(apiError?.detail || 'Error al reactivar usuario');
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Está seguro de desactivar este usuario?')) return;
    
    setUpdating(userId);
    setError(null);

    try {
      // TODO: Implementar AdminApiService.deactivateUser cuando esté disponible
      // await AdminApiService.deactivateUser(token, userId);
      setSuccess('Usuario desactivado exitosamente');
      loadUsers();
    } catch (err: unknown) {
      const apiError = err as { detail?: string };
      setError(apiError?.detail || 'Error al desactivar usuario');
    } finally {
      setUpdating(null);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [token, roleFilter, statusFilter]);

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
      label: 'Cambiar Rol',
      render: (_value: string, user: UserListItem) => (
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
