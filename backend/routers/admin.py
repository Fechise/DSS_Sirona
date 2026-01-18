"""
Router de Administración - Gestión de Usuarios, Integridad y Auditoría
=======================================================================
Endpoints para administradores del sistema:
- CRUD de usuarios (PBI-18)
- Validación de integridad de historiales (PBI-20)
- Consulta de logs de auditoría (PBI-15)
"""

from fastapi import APIRouter, HTTPException, status, Depends, Request, BackgroundTasks
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr
from enum import Enum

from models.models import PatientHistory, User, UserRole, UserStatus, AuditLog
from services.auth import get_admin_user
from services.integrity import integrity_service
from services.audit import audit_logger, AuditEventType
from services.security import hash_password, validate_password_strength
from services.email_service import generate_temporary_password, send_temporary_password_email, EmailServiceError

router = APIRouter()


# ==================== USER SCHEMAS ====================
class UserListItemResponse(BaseModel):
    """Datos de usuario para listado."""
    id: str
    fullName: str
    email: str
    cedula: str
    role: str
    status: str
    created_at: datetime
    last_login: Optional[datetime] = None
    # Campos específicos por rol
    especialidad: Optional[str] = None
    numeroLicencia: Optional[str] = None
    departamento: Optional[str] = None
    telefonoContacto: Optional[str] = None


class UsersListResponse(BaseModel):
    """Lista de usuarios con total."""
    total: int
    users: List[UserListItemResponse]


class CreateUserRequest(BaseModel):
    """Crear un nuevo usuario (Admin)."""
    email: EmailStr
    fullName: str
    cedula: str
    role: str  # Administrador, Médico, Paciente, Secretario
    # Campos específicos por rol
    especialidad: Optional[str] = None
    numeroLicencia: Optional[str] = None
    departamento: Optional[str] = None
    telefonoContacto: Optional[str] = None
    fechaNacimiento: Optional[str] = None
    # Campos demográficos adicionales (Para Paciente)
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    pais: Optional[str] = None
    genero: Optional[str] = None
    estadoCivil: Optional[str] = None
    ocupacion: Optional[str] = None
    grupoSanguineo: Optional[str] = None


class UpdateUserRequest(BaseModel):
    """Actualizar datos de un usuario."""
    fullName: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    status: Optional[str] = None
    # Campos específicos por rol
    especialidad: Optional[str] = None
    numeroLicencia: Optional[str] = None
    departamento: Optional[str] = None
    telefonoContacto: Optional[str] = None


class UpdateUserRoleRequest(BaseModel):
    """Cambiar el rol de un usuario."""
    role: str  # Administrador, Médico, Paciente, Secretario


# ==================== USER ENDPOINTS (PBI-18) ====================

@router.get("/users", response_model=UsersListResponse)
async def list_users(
    request: Request,
    role: Optional[str] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(get_admin_user)
):
    """
    Listar todos los usuarios del sistema.
    Solo administradores pueden ver esta lista.
    
    Parámetros:
        role: Filtrar por rol (Administrador, Médico, Paciente, Secretario)
        status_filter: Filtrar por estado (Activo, Inactivo, Bloqueado)
        search: Buscar por nombre o email
        limit: Límite de resultados
        offset: Offset para paginación
    """
    # Construir query
    query = {}
    
    if role:
        try:
            query["role"] = UserRole(role)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role. Valid roles: {[r.value for r in UserRole]}"
            )
    
    if status_filter:
        try:
            query["status"] = UserStatus(status_filter)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Valid statuses: {[s.value for s in UserStatus]}"
            )
    
    # Obtener total
    total = await User.find(query).count()
    
    # Obtener usuarios con paginación
    users = await User.find(query).sort(
        [("created_at", -1)]
    ).skip(offset).limit(limit).to_list()
    
    # Filtrar por búsqueda si se proporciona
    if search:
        search_lower = search.lower()
        users = [
            u for u in users 
            if search_lower in u.fullName.lower() or search_lower in u.email.lower()
        ]
        total = len(users)
    
    # Log de auditoría
    await audit_logger.log_event(
        event_type=AuditEventType.USUARIO_CONSULTADO,
        user_id=str(current_user.id),
        user_email=current_user.email,
        user_role=current_user.role.value,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        details={
            "action": "list_users",
            "filters": {"role": role, "status": status_filter, "search": search},
            "total_returned": len(users)
        }
    )
    
    return UsersListResponse(
        total=total,
        users=[
            UserListItemResponse(
                id=str(u.id),
                fullName=u.fullName,
                email=u.email,
                cedula=u.cedula,
                role=u.role.value,
                status=u.status.value,
                created_at=u.created_at,
                last_login=u.last_login,
                especialidad=u.especialidad,
                numeroLicencia=u.numeroLicencia,
                departamento=u.departamento,
                telefonoContacto=u.telefonoContacto
            )
            for u in users
        ]
    )


@router.get("/users/{user_id}", response_model=UserListItemResponse)
async def get_user(
    user_id: str,
    request: Request,
    current_user: User = Depends(get_admin_user)
):
    """
    Obtener datos de un usuario específico.
    Solo administradores.
    """
    user = await User.get(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserListItemResponse(
        id=str(user.id),
        fullName=user.fullName,
        email=user.email,
        cedula=user.cedula,
        role=user.role.value,
        status=user.status.value,
        created_at=user.created_at,
        last_login=user.last_login,
        especialidad=user.especialidad,
        numeroLicencia=user.numeroLicencia,
        departamento=user.departamento,
        telefonoContacto=user.telefonoContacto
    )


@router.post("/users", response_model=UserListItemResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    data: CreateUserRequest,
    request: Request,
    current_user: User = Depends(get_admin_user)
):
    """
    Crear un nuevo usuario de cualquier rol.
    Solo administradores pueden crear usuarios.
    La contraseña se genera automáticamente y se envía por email.
    """
    # Validar rol
    try:
        user_role = UserRole(data.role)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Valid roles: {[r.value for r in UserRole]}"
        )
    
    # Verificar email único
    existing_email = await User.find_one(User.email == data.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Verificar cédula única
    existing_cedula = await User.find_one(User.cedula == data.cedula)
    if existing_cedula:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cedula already registered"
        )
    
    # Generar contraseña temporal
    temporary_password = generate_temporary_password()
    
    # Crear usuario
    new_user = User(
        email=data.email,
        password_hash=hash_password(temporary_password),
        fullName=data.fullName,
        cedula=data.cedula,
        role=user_role,
        status=UserStatus.ACTIVO,
        especialidad=data.especialidad if user_role == UserRole.MEDICO else None,
        numeroLicencia=data.numeroLicencia if user_role == UserRole.MEDICO else None,
        departamento=data.departamento if user_role == UserRole.SECRETARIO else None,
        telefonoContacto=data.telefonoContacto if user_role == UserRole.PACIENTE else None,
        direccion=data.direccion if user_role == UserRole.PACIENTE else None,
        ciudad=data.ciudad if user_role == UserRole.PACIENTE else None,
        pais=data.pais if user_role == UserRole.PACIENTE else None,
        genero=data.genero if user_role == UserRole.PACIENTE else None,
        estadoCivil=data.estadoCivil if user_role == UserRole.PACIENTE else None,
        ocupacion=data.ocupacion if user_role == UserRole.PACIENTE else None,
        grupoSanguineo=data.grupoSanguineo if user_role == UserRole.PACIENTE else None,
        member_since=datetime.utcnow().strftime("%B %Y")
    )
    
    await new_user.insert()
    
    # Enviar email con contraseña temporal
    try:
        await send_temporary_password_email(
            to_email=data.email,
            full_name=data.fullName,
            temporary_password=temporary_password,
            role=data.role
        )
    except EmailServiceError as e:
        # Log pero no fallar el registro
        await audit_logger.log_event(
            event_type=AuditEventType.ERROR_SISTEMA,
            user_id=str(current_user.id),
            user_email=current_user.email,
            user_role=current_user.role.value,
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            details={"error": "email_send_failed", "message": str(e)}
        )
    
    # Log de auditoría
    await audit_logger.log_event(
        event_type=AuditEventType.USUARIO_CREADO,
        user_id=str(current_user.id),
        user_email=current_user.email,
        user_role=current_user.role.value,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        details={
            "action": "create_user",
            "new_user_id": str(new_user.id),
            "new_user_email": data.email,
            "new_user_role": data.role
        }
    )
    
    return UserListItemResponse(
        id=str(new_user.id),
        fullName=new_user.fullName,
        email=new_user.email,
        cedula=new_user.cedula,
        role=new_user.role.value,
        status=new_user.status.value,
        created_at=new_user.created_at,
        last_login=new_user.last_login,
        especialidad=new_user.especialidad,
        numeroLicencia=new_user.numeroLicencia,
        departamento=new_user.departamento,
        telefonoContacto=new_user.telefonoContacto
    )


@router.put("/users/{user_id}", response_model=UserListItemResponse)
async def update_user(
    user_id: str,
    data: UpdateUserRequest,
    request: Request,
    current_user: User = Depends(get_admin_user)
):
    """
    Actualizar datos de un usuario.
    Solo administradores.
    """
    user = await User.get(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Guardar valores anteriores para auditoría
    old_values = {
        "role": user.role.value,
        "status": user.status.value,
        "fullName": user.fullName,
        "email": user.email
    }
    
    # Actualizar campos si se proporcionan
    if data.fullName is not None:
        user.fullName = data.fullName
    
    if data.email is not None:
        # Verificar que no exista otro usuario con ese email
        existing = await User.find_one(User.email == data.email)
        if existing and str(existing.id) != user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        user.email = data.email
    
    if data.role is not None:
        try:
            user.role = UserRole(data.role)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role. Valid roles: {[r.value for r in UserRole]}"
            )
    
    if data.status is not None:
        try:
            user.status = UserStatus(data.status)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Valid statuses: {[s.value for s in UserStatus]}"
            )
    
    # Campos específicos por rol
    if data.especialidad is not None:
        user.especialidad = data.especialidad
    if data.numeroLicencia is not None:
        user.numeroLicencia = data.numeroLicencia
    if data.departamento is not None:
        user.departamento = data.departamento
    if data.telefonoContacto is not None:
        user.telefonoContacto = data.telefonoContacto
    
    await user.save()
    
    # Log de auditoría
    await audit_logger.log_event(
        event_type=AuditEventType.USUARIO_EDITADO,
        user_id=str(current_user.id),
        user_email=current_user.email,
        user_role=current_user.role.value,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        details={
            "action": "update_user",
            "target_user_id": user_id,
            "old_values": old_values,
            "new_values": data.dict(exclude_unset=True)
        }
    )
    
    return UserListItemResponse(
        id=str(user.id),
        fullName=user.fullName,
        email=user.email,
        cedula=user.cedula,
        role=user.role.value,
        status=user.status.value,
        created_at=user.created_at,
        last_login=user.last_login,
        especialidad=user.especialidad,
        numeroLicencia=user.numeroLicencia,
        departamento=user.departamento,
        telefonoContacto=user.telefonoContacto
    )


@router.patch("/users/{user_id}/role", response_model=UserListItemResponse)
async def update_user_role(
    user_id: str,
    data: UpdateUserRoleRequest,
    request: Request,
    current_user: User = Depends(get_admin_user)
):
    """
    Cambiar el rol de un usuario.
    Solo administradores.
    
    Previene que el último administrador pierda su rol.
    """
    user = await User.get(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Validar rol
    try:
        new_role = UserRole(data.role)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Valid roles: {[r.value for r in UserRole]}"
        )
    
    # Prevenir quedarse sin administradores
    if user.role == UserRole.ADMINISTRADOR and new_role != UserRole.ADMINISTRADOR:
        admin_count = await User.find(User.role == UserRole.ADMINISTRADOR).count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot change role. This is the last administrator."
            )
    
    old_role = user.role.value
    user.role = new_role
    await user.save()
    
    # Log de auditoría
    await audit_logger.log_event(
        event_type=AuditEventType.ROL_CAMBIADO,
        user_id=str(current_user.id),
        user_email=current_user.email,
        user_role=current_user.role.value,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        details={
            "action": "change_role",
            "target_user_id": user_id,
            "target_user_email": user.email,
            "old_role": old_role,
            "new_role": new_role.value
        }
    )
    
    return UserListItemResponse(
        id=str(user.id),
        fullName=user.fullName,
        email=user.email,
        cedula=user.cedula,
        role=user.role.value,
        status=user.status.value,
        created_at=user.created_at,
        last_login=user.last_login,
        especialidad=user.especialidad,
        numeroLicencia=user.numeroLicencia,
        departamento=user.departamento,
        telefonoContacto=user.telefonoContacto
    )


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    request: Request,
    current_user: User = Depends(get_admin_user)
):
    """
    Eliminar (desactivar) un usuario.
    Solo administradores.
    
    No se elimina físicamente, solo se marca como inactivo.
    """
    user = await User.get(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevenir auto-eliminación
    if str(current_user.id) == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    # Prevenir quedarse sin administradores
    if user.role == UserRole.ADMINISTRADOR:
        admin_count = await User.find(User.role == UserRole.ADMINISTRADOR).count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete. This is the last administrator."
            )
    
    # Soft delete - marcar como inactivo
    user.status = UserStatus.INACTIVO
    await user.save()
    
    # Log de auditoría
    await audit_logger.log_event(
        event_type=AuditEventType.USUARIO_ELIMINADO,
        user_id=str(current_user.id),
        user_email=current_user.email,
        user_role=current_user.role.value,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        details={
            "action": "delete_user",
            "deleted_user_id": user_id,
            "deleted_user_email": user.email,
            "deleted_user_role": user.role.value
        }
    )
    
    return None


# ==================== INTEGRITY SCHEMAS ====================
class IntegrityCheckResult(BaseModel):
    """Resultado de verificación de integridad de un historial."""
    history_id: str
    patient_id: str
    is_valid: bool
    expected_hash: Optional[str] = None
    calculated_hash: Optional[str] = None
    is_corrupted: bool = False
    corruption_reason: Optional[str] = None


class IntegrityReportResponse(BaseModel):
    """Reporte completo de verificación de integridad."""
    total_histories: int
    valid_count: int
    invalid_count: int
    corrupted_count: int
    missing_hash_count: int
    results: List[IntegrityCheckResult]
    checked_at: datetime


class AuditLogResponse(BaseModel):
    """Respuesta de log de auditoría."""
    id: str
    timestamp: datetime
    event: str
    user_email: Optional[str] = None
    user_id: Optional[str] = None
    ip_address: str
    user_agent: str
    details: dict


class AuditLogsListResponse(BaseModel):
    """Lista de logs de auditoría."""
    total: int
    logs: List[AuditLogResponse]


# --- ENDPOINTS ---
@router.get("/integrity/check-all", response_model=IntegrityReportResponse)
async def check_all_histories_integrity(
    request: Request,
    current_user: User = Depends(get_admin_user)
):
    """
    Verificar la integridad de TODOS los historiales médicos.
    Solo administradores pueden ejecutar esta operación.
    
    Este endpoint implementa el "job nocturno" de validación (PBI-20).
    Puede ejecutarse manualmente o programarse vía cron/scheduler.
    
    Returns:
        Reporte con el estado de integridad de todos los historiales
    """
    # Obtener todos los historiales
    all_histories = await PatientHistory.find_all().to_list()
    
    results = []
    valid_count = 0
    invalid_count = 0
    corrupted_count = 0
    missing_hash_count = 0
    
    for history in all_histories:
        # Verificar integridad
        is_valid, expected_hash, calculated_hash = await integrity_service.verify_integrity(
            history=history,
            ip_address=request.client.host,
            user_agent="integrity_job"
        )
        
        is_corrupted = getattr(history, 'is_corrupted', False)
        corruption_reason = getattr(history, 'corruption_reason', None)
        
        result = IntegrityCheckResult(
            history_id=str(history.id),
            patient_id=history.patient_id,
            is_valid=is_valid,
            expected_hash=expected_hash[:16] + "..." if expected_hash else None,
            calculated_hash=calculated_hash[:16] + "..." if calculated_hash else None,
            is_corrupted=is_corrupted,
            corruption_reason=corruption_reason
        )
        results.append(result)
        
        if not expected_hash:
            missing_hash_count += 1
        elif is_valid:
            valid_count += 1
        else:
            invalid_count += 1
            # Marcar como corrupto si no lo está ya
            if not is_corrupted:
                await integrity_service.mark_as_corrupted(
                    history=history,
                    reason="Hash mismatch detected during integrity job",
                    ip_address=request.client.host
                )
                corrupted_count += 1
        
        if is_corrupted:
            corrupted_count += 1
    
    # Log de auditoría
    await audit_logger.log_event(
        event_type=AuditEventType.INTEGRIDAD_VERIFICADA,
        user_id=str(current_user.id),
        user_email=current_user.email,
        user_role=current_user.role.value,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        details={
            "total_histories": len(all_histories),
            "valid_count": valid_count,
            "invalid_count": invalid_count,
            "corrupted_count": corrupted_count,
            "missing_hash_count": missing_hash_count
        }
    )
    
    return IntegrityReportResponse(
        total_histories=len(all_histories),
        valid_count=valid_count,
        invalid_count=invalid_count,
        corrupted_count=corrupted_count,
        missing_hash_count=missing_hash_count,
        results=results,
        checked_at=datetime.utcnow()
    )


@router.post("/integrity/regenerate-hashes")
async def regenerate_all_hashes(
    request: Request,
    current_user: User = Depends(get_admin_user)
):
    """
    Regenerar los hashes de integridad para TODOS los historiales.
    Solo administradores pueden ejecutar esta operación.
    
    ADVERTENCIA: Solo usar para inicialización o después de una migración.
    Esto NO debe usarse para "arreglar" historiales corruptos.
    """
    all_histories = await PatientHistory.find_all().to_list()
    
    updated_count = 0
    for history in all_histories:
        # Solo regenerar si no está marcado como corrupto
        is_corrupted = getattr(history, 'is_corrupted', False)
        if not is_corrupted:
            new_hash = integrity_service.calculate_hash(history)
            history.integrity_hash = new_hash
            await history.save()
            updated_count += 1
    
    # Log de auditoría
    await audit_logger.log_event(
        event_type=AuditEventType.INTEGRIDAD_VERIFICADA,
        user_id=str(current_user.id),
        user_email=current_user.email,
        user_role=current_user.role.value,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        details={
            "action": "regenerate_all_hashes",
            "total_histories": len(all_histories),
            "updated_count": updated_count
        }
    )
    
    return {
        "message": f"Regenerated hashes for {updated_count} histories",
        "total": len(all_histories),
        "updated": updated_count,
        "skipped_corrupted": len(all_histories) - updated_count
    }


@router.get("/integrity/corrupted", response_model=List[IntegrityCheckResult])
async def get_corrupted_histories(
    request: Request,
    current_user: User = Depends(get_admin_user)
):
    """
    Obtener lista de historiales marcados como corruptos.
    Solo administradores pueden ver esta información.
    """
    corrupted = await PatientHistory.find({
        "is_corrupted": True
    }).to_list()
    
    results = []
    for history in corrupted:
        results.append(IntegrityCheckResult(
            history_id=str(history.id),
            patient_id=history.patient_id,
            is_valid=False,
            expected_hash=history.integrity_hash[:16] + "..." if history.integrity_hash else None,
            calculated_hash=None,  # No recalculamos aquí
            is_corrupted=True,
            corruption_reason=history.corruption_reason
        ))
    
    return results


@router.post("/integrity/clear-corruption/{history_id}")
async def clear_corruption_flag(
    history_id: str,
    request: Request,
    current_user: User = Depends(get_admin_user)
):
    """
    Limpiar el flag de corrupción de un historial y regenerar su hash.
    Solo administradores pueden ejecutar esta operación.
    
    ADVERTENCIA: Solo usar después de verificar manualmente que los datos son correctos.
    """
    history = await PatientHistory.get(history_id)
    
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="History not found"
        )
    
    # Limpiar flags de corrupción
    history.is_corrupted = False
    history.corruption_detected_at = None
    history.corruption_reason = None
    
    # Regenerar hash
    new_hash = integrity_service.calculate_hash(history)
    history.integrity_hash = new_hash
    
    await history.save()
    
    # Log de auditoría
    await audit_logger.log_event(
        event_type=AuditEventType.HISTORIAL_EDITADO,
        user_id=str(current_user.id),
        user_email=current_user.email,
        user_role=current_user.role.value,
        patient_id=history.patient_id,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        details={
            "action": "clear_corruption_flag",
            "history_id": history_id,
            "new_hash": new_hash[:16] + "..."
        }
    )
    
    return {
        "message": "Corruption flag cleared and hash regenerated",
        "history_id": history_id,
        "new_hash": new_hash[:16] + "..."
    }


@router.get("/audit/logs", response_model=AuditLogsListResponse)
async def get_audit_logs(
    request: Request,
    event_type: Optional[str] = None,
    user_email: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(get_admin_user)
):
    """
    Obtener logs de auditoría.
    Solo administradores pueden ver los logs.
    
    Parámetros:
        event_type: Filtrar por tipo de evento
        user_email: Filtrar por email de usuario
        limit: Límite de resultados (default: 100)
        offset: Offset para paginación
    """
    # Construir query
    query = {}
    if event_type:
        query["event"] = event_type
    if user_email:
        query["user_email"] = user_email
    
    # Obtener total
    total = await AuditLog.find(query).count()
    
    # Obtener logs con paginación
    logs = await AuditLog.find(query).sort(
        [("timestamp", -1)]
    ).skip(offset).limit(limit).to_list()
    
    return AuditLogsListResponse(
        total=total,
        logs=[
            AuditLogResponse(
                id=str(log.id),
                timestamp=log.timestamp,
                event=log.event,
                user_email=log.user_email,
                user_id=log.user_id,
                ip_address=log.ip_address,
                user_agent=log.user_agent,
                details=log.details
            )
            for log in logs
        ]
    )


@router.get("/audit/events")
async def get_audit_event_types(
    current_user: User = Depends(get_admin_user)
):
    """
    Obtener lista de tipos de eventos disponibles.
    """
    return {
        "event_types": [e.value for e in AuditEventType]
    }
