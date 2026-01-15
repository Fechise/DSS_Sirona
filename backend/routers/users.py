"""
Router para gestión de usuarios (PBI-18).
Solo accesible por usuarios con rol Administrador.
"""
from fastapi import APIRouter, HTTPException, status, Request, Depends
from typing import List
from datetime import datetime

from models.models import User, AuditLog, UserRole, UserStatus
from schemas.user_schemas import (
    UserListResponse,
    UserDetailResponse,
    UpdateUserRoleRequest,
    UpdateUserStatusRequest,
    UserActionResponse
)
from services.auth import get_admin_user, get_current_user

router = APIRouter()


async def log_user_management_event(
    event: str,
    admin_user: User,
    target_user_id: str,
    ip_address: str,
    user_agent: str,
    details: dict = None
):
    """
    Registra eventos de gestión de usuarios en el log de auditoría.
    Crítico para cumplimiento de seguridad y trazabilidad.
    """
    log_entry = AuditLog(
        event=event,
        user_id=str(admin_user.id),
        user_email=admin_user.email,
        ip_address=ip_address,
        user_agent=user_agent,
        details={
            "admin_role": admin_user.role.value,
            "target_user_id": target_user_id,
            **(details or {})
        }
    )
    await log_entry.insert()


@router.get("/", response_model=List[UserListResponse])
async def list_users(
    request: Request,
    current_user: User = Depends(get_admin_user)
):
    """
    Obtiene la lista de todos los usuarios del sistema.
    Solo accesible por Administradores.
    
    No incluye campos sensibles como:
    - password_hash
    - biometric_template
    - mfa_secret
    """
    users = await User.find_all().to_list()
    
    await log_user_management_event(
        event="users_list_viewed",
        admin_user=current_user,
        target_user_id="all",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        details={"users_count": len(users)}
    )
    
    return [
        UserListResponse(
            id=str(user.id),
            email=user.email,
            fullName=user.fullName,
            cedula=user.cedula,
            role=user.role.value,
            status=user.status.value,
            created_at=user.created_at,
            last_login=user.last_login,
            especialidad=user.especialidad,
            departamento=user.departamento
        )
        for user in users
    ]


@router.get("/{user_id}", response_model=UserDetailResponse)
async def get_user_detail(
    user_id: str,
    request: Request,
    current_user: User = Depends(get_admin_user)
):
    """
    Obtiene los detalles de un usuario específico.
    Solo accesible por Administradores.
    """
    user = await User.get(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    await log_user_management_event(
        event="user_detail_viewed",
        admin_user=current_user,
        target_user_id=user_id,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", "")
    )
    
    return UserDetailResponse(
        id=str(user.id),
        email=user.email,
        fullName=user.fullName,
        cedula=user.cedula,
        role=user.role.value,
        status=user.status.value,
        created_at=user.created_at,
        last_login=user.last_login,
        member_since=user.member_since,
        especialidad=user.especialidad,
        numeroLicencia=user.numeroLicencia,
        departamento=user.departamento,
        telefonoContacto=user.telefonoContacto,
        fechaNacimiento=user.fechaNacimiento,
        permissions=user.permissions,
        mfa_enabled=user.security.mfa_enabled,
        failed_attempts=user.security.failed_attempts,
        lockout_until=user.security.lockout_until
    )


@router.put("/{user_id}/role", response_model=UserActionResponse)
async def update_user_role(
    user_id: str,
    data: UpdateUserRoleRequest,
    request: Request,
    current_user: User = Depends(get_admin_user)
):
    """
    Actualiza el rol de un usuario.
    Solo accesible por Administradores.
    
    Validaciones:
    - El usuario objetivo debe existir
    - El nuevo rol debe ser válido
    - No se puede quitar el rol de Administrador si es el último
    - Un admin no puede cambiar su propio rol
    """
    user = await User.get(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Validar que el rol sea válido
    try:
        new_role = UserRole(data.role)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Valid roles are: {[r.value for r in UserRole]}"
        )
    
    # Prevenir que un admin se cambie su propio rol
    if str(user.id) == str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role"
        )
    
    # Prevenir eliminar el último administrador
    if user.role == UserRole.ADMINISTRADOR and new_role != UserRole.ADMINISTRADOR:
        admin_count = await User.find(User.role == UserRole.ADMINISTRADOR).count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove the last administrator"
            )
    
    old_role = user.role.value
    user.role = new_role
    
    # Actualizar permisos según el nuevo rol
    user.permissions = get_permissions_for_role(new_role)
    
    await user.save()
    
    await log_user_management_event(
        event="user_role_changed",
        admin_user=current_user,
        target_user_id=user_id,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        details={
            "old_role": old_role,
            "new_role": new_role.value,
            "target_email": user.email
        }
    )
    
    return UserActionResponse(
        success=True,
        message=f"User role updated from {old_role} to {new_role.value}",
        user_id=user_id
    )


@router.put("/{user_id}/status", response_model=UserActionResponse)
async def update_user_status(
    user_id: str,
    data: UpdateUserStatusRequest,
    request: Request,
    current_user: User = Depends(get_admin_user)
):
    """
    Actualiza el estado de un usuario (Activo, Inactivo, Bloqueado).
    Solo accesible por Administradores.
    
    Útil para:
    - Desbloquear manualmente una cuenta bloqueada
    - Desactivar cuentas de usuarios que ya no trabajan
    """
    user = await User.get(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Validar que el estado sea válido
    try:
        new_status = UserStatus(data.status)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Valid statuses are: {[s.value for s in UserStatus]}"
        )
    
    # Prevenir que un admin se desactive a sí mismo
    if str(user.id) == str(current_user.id) and new_status != UserStatus.ACTIVO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )
    
    old_status = user.status.value
    user.status = new_status
    
    # Si se activa el usuario, limpiar el lockout
    if new_status == UserStatus.ACTIVO:
        user.security.lockout_until = None
        user.security.failed_attempts = 0
    
    await user.save()
    
    await log_user_management_event(
        event="user_status_changed",
        admin_user=current_user,
        target_user_id=user_id,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        details={
            "old_status": old_status,
            "new_status": new_status.value,
            "target_email": user.email
        }
    )
    
    return UserActionResponse(
        success=True,
        message=f"User status updated from {old_status} to {new_status.value}",
        user_id=user_id
    )


@router.delete("/{user_id}", response_model=UserActionResponse)
async def delete_user(
    user_id: str,
    request: Request,
    current_user: User = Depends(get_admin_user)
):
    """
    Elimina un usuario del sistema.
    Solo accesible por Administradores.
    
    ADVERTENCIA: Esta acción es irreversible.
    Considerar usar update_user_status para desactivar en lugar de eliminar.
    """
    user = await User.get(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevenir auto-eliminación
    if str(user.id) == str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    # Prevenir eliminar el último administrador
    if user.role == UserRole.ADMINISTRADOR:
        admin_count = await User.find(User.role == UserRole.ADMINISTRADOR).count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete the last administrator"
            )
    
    user_email = user.email
    await user.delete()
    
    await log_user_management_event(
        event="user_deleted",
        admin_user=current_user,
        target_user_id=user_id,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        details={
            "deleted_email": user_email,
            "deleted_role": user.role.value
        }
    )
    
    return UserActionResponse(
        success=True,
        message=f"User {user_email} deleted successfully",
        user_id=user_id
    )


def get_permissions_for_role(role: UserRole) -> list[str]:
    """
    Retorna los permisos predeterminados según el rol.
    """
    permissions_map = {
        UserRole.ADMINISTRADOR: [
            "manage_users",
            "view_all_patients",
            "view_audit_logs",
            "manage_system_settings",
            "view_reports"
        ],
        UserRole.MEDICO: [
            "view_patients",
            "create_medical_records",
            "edit_own_records",
            "prescribe_medication"
        ],
        UserRole.PACIENTE: [
            "view_own_history",
            "schedule_appointments",
            "view_own_appointments"
        ],
        UserRole.SECRETARIO: [
            "view_patient_demographics",
            "manage_appointments",
            "register_patients",
            "register_doctors"
        ]
    }
    return permissions_map.get(role, [])
