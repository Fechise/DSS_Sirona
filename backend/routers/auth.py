from fastapi import APIRouter, HTTPException, status, Request, Depends
from datetime import datetime, timedelta
import os

from models.models import User, AuditLog, UserStatus, UserRole, PatientHistory
from schemas.auth_schemas import (
    LoginRequest,
    LoginResponse,
    LoginMFAResponse,
    AccountLockedResponse,
    ErrorResponse,
    RegisterDoctorRequest,
    RegisterSecretaryRequest,
    RegisterPatientRequest,
    RegisterResponse
)
from services.security import verify_password, create_access_token, hash_password, validate_password_strength
from services.auth import get_admin_user, get_secretary_user
from services.email_service import generate_temporary_password, send_temporary_password_email, EmailServiceError

router = APIRouter()

# Configuración de bloqueo
MAX_LOGIN_ATTEMPTS = int(os.getenv("MAX_LOGIN_ATTEMPTS", "5"))
LOCKOUT_DURATION_MINUTES = int(os.getenv("LOCKOUT_DURATION_MINUTES", "15"))


@router.post("/login", response_model=LoginResponse | LoginMFAResponse)
async def login(login_data: LoginRequest, request: Request):
    
    # Buscar usuario por email
    user = await User.find_one(User.email == login_data.email)
    
    if not user:
        # No revelar si el email existe o no
        await log_audit_event(
            event="login_failed",
            user_email=login_data.email,
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            details={"reason": "user_not_found"}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Verificar si la cuenta está bloqueada
    if user.security.lockout_until and user.security.lockout_until > datetime.utcnow():
        await log_audit_event(
            event="login_blocked",
            user_email=user.email,
            user_id=str(user.id),
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            details={"locked_until": user.security.lockout_until.isoformat()}
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "account_locked": True,
                "locked_until": user.security.lockout_until.isoformat(),
                "message": "Account locked due to too many failed login attempts"
            }
        )
    
    # Desbloquear cuenta si ya pasó el tiempo
    if user.security.lockout_until and user.security.lockout_until <= datetime.utcnow():
        user.security.lockout_until = None
        user.security.failed_attempts = 0
        await user.save()
    
    # Verificar contraseña
    if not verify_password(login_data.password, user.password_hash):
        # Incrementar contador de intentos fallidos
        user.security.failed_attempts += 1
        
        # Bloquear si alcanza el máximo
        if user.security.failed_attempts >= MAX_LOGIN_ATTEMPTS:
            user.security.lockout_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
            user.status = UserStatus.BLOQUEADO
            await user.save()
            
            await log_audit_event(
                event="account_locked",
                user_email=user.email,
                user_id=str(user.id),
                ip_address=request.client.host,
                user_agent=request.headers.get("user-agent", ""),
                details={
                    "attempts": user.security.failed_attempts,
                    "locked_until": user.security.lockout_until.isoformat()
                }
            )
            
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "account_locked": True,
                    "locked_until": user.security.lockout_until.isoformat(),
                    "message": "Account locked due to too many failed login attempts"
                }
            )
        
        await user.save()
        
        await log_audit_event(
            event="login_failed",
            user_email=user.email,
            user_id=str(user.id),
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            details={"attempts_count": user.security.failed_attempts}
        )
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Login exitoso - reiniciar contador
    user.security.failed_attempts = 0
    user.security.lockout_until = None
    user.last_login = datetime.utcnow()
    if user.status == UserStatus.BLOQUEADO:
        user.status = UserStatus.ACTIVO
    await user.save()
    
    await log_audit_event(
        event="login_success",
        user_email=user.email,
        user_id=str(user.id),
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        details={"role": user.role.value}
    )
    
    # Verificar si requiere MFA
    if user.security.mfa_enabled:
        return LoginMFAResponse(
            requires_mfa=True,
            message="Please verify with MFA"
        )
    
    # Crear token JWT
    token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value
        }
    )
    
    return LoginResponse(
        token=token,
        role=user.role.value,
        requires_mfa=False
    )



@router.post("/register-doctor", response_model=RegisterResponse, responses={400: {"model": ErrorResponse}})
async def register_doctor(
    data: RegisterDoctorRequest,
    request: Request,
    current_user: User = Depends(get_secretary_user)
):
    """
    Endpoint para registrar un nuevo médico.
    Solo secretarios pueden crear doctores.
    La contraseña se genera automáticamente y se envía por email.
    """
    # Verificar si el email ya existe
    existing_user = await User.find_one(User.email == data.email)
    if existing_user:
        await log_audit_event(
            event="register_doctor_failed",
            user_email=data.email,
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            user_id=str(current_user.id),
            details={"reason": "email_already_exists"}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Email already registered"}
        )
    
    # Verificar si la cédula ya existe
    existing_cedula = await User.find_one(User.cedula == data.cedula)
    if existing_cedula:
        await log_audit_event(
            event="register_doctor_failed",
            user_email=data.email,
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            user_id=str(current_user.id),
            details={"reason": "cedula_already_exists"}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Cedula already registered"}
        )
    
    # Generar contraseña temporal
    temporary_password = generate_temporary_password()
    
    # Crear usuario médico
    new_user = User(
        email=data.email,
        password_hash=hash_password(temporary_password),
        fullName=data.fullName,
        cedula=data.cedula,
        role=UserRole.MEDICO,
        status=UserStatus.ACTIVO,
        especialidad=data.especialidad,
        numeroLicencia=data.numeroLicencia,
        permissions=["view_patients", "create_medical_records", "edit_own_records", "prescribe_medication"],
        member_since=datetime.utcnow().strftime("%B %Y")
    )
    
    await new_user.insert()
    
    # Enviar email con contraseña temporal
    try:
        await send_temporary_password_email(
            to_email=data.email,
            full_name=data.fullName,
            temporary_password=temporary_password,
            role="Médico"
        )
    except EmailServiceError as e:
        # Log pero no fallar el registro si el email falla
        await log_audit_event(
            event="email_send_failed",
            user_email=data.email,
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            user_id=str(new_user.id),
            details={"error": str(e)}
        )
    
    await log_audit_event(
        event="doctor_registered",
        user_email=data.email,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        user_id=str(new_user.id),
        details={
            "registered_by": str(current_user.id),
            "registered_by_email": current_user.email,
            "role": "Médico"
        }
    )
    
    return RegisterResponse(
        message="Doctor registered successfully",
        user_id=str(new_user.id)
    )


@router.post("/register-secretary", response_model=RegisterResponse, responses={400: {"model": ErrorResponse}})
async def register_secretary(
    data: RegisterSecretaryRequest,
    request: Request,
    current_user: User = Depends(get_admin_user)
):
    """
    Endpoint para registrar un nuevo secretario.
    Solo administradores pueden crear secretarios.
    La contraseña se genera automáticamente y se envía por email.
    """
    # Verificar si el email ya existe
    existing_user = await User.find_one(User.email == data.email)
    if existing_user:
        await log_audit_event(
            event="register_secretary_failed",
            user_email=data.email,
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            user_id=str(current_user.id),
            details={"reason": "email_already_exists"}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Email already registered"}
        )
    
    # Verificar si la cédula ya existe
    existing_cedula = await User.find_one(User.cedula == data.cedula)
    if existing_cedula:
        await log_audit_event(
            event="register_secretary_failed",
            user_email=data.email,
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            user_id=str(current_user.id),
            details={"reason": "cedula_already_exists"}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Cedula already registered"}
        )
    
    # Generar contraseña temporal
    temporary_password = generate_temporary_password()
    
    # Crear usuario secretario
    new_user = User(
        email=data.email,
        password_hash=hash_password(temporary_password),
        fullName=data.fullName,
        cedula=data.cedula,
        role=UserRole.SECRETARIO,
        status=UserStatus.ACTIVO,
        departamento=data.departamento,
        permissions=["manage_appointments", "view_patient_list", "create_patient_records", "generate_reports"],
        member_since=datetime.utcnow().strftime("%B %Y")
    )
    
    await new_user.insert()
    
    # Enviar email con contraseña temporal
    try:
        await send_temporary_password_email(
            to_email=data.email,
            full_name=data.fullName,
            temporary_password=temporary_password,
            role="Secretario"
        )
    except EmailServiceError as e:
        await log_audit_event(
            event="email_send_failed",
            user_email=data.email,
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            user_id=str(new_user.id),
            details={"error": str(e)}
        )
    
    await log_audit_event(
        event="secretary_registered",
        user_email=data.email,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        user_id=str(new_user.id),
        details={
            "registered_by": str(current_user.id),
            "registered_by_email": current_user.email,
            "role": "Secretario"
        }
    )
    
    return RegisterResponse(
        message="Secretary registered successfully",
        user_id=str(new_user.id)
    )


@router.post("/register-patient", response_model=RegisterResponse, responses={400: {"model": ErrorResponse}})
async def register_patient(
    data: RegisterPatientRequest,
    request: Request,
    current_user: User = Depends(get_secretary_user)
):
    """
    Endpoint para registrar un nuevo paciente.
    Solo secretarios pueden crear pacientes.
    La contraseña se genera automáticamente y se envía por email.
    Se crea un PatientHistory inicial con los datos demográficos proporcionados.
    """
    # Verificar si el email ya existe
    existing_user = await User.find_one(User.email == data.email)
    if existing_user:
        await log_audit_event(
            event="register_patient_failed",
            user_email=data.email,
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            user_id=str(current_user.id),
            details={"reason": "email_already_exists"}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Email already registered"}
        )
    
    # Verificar si la cédula ya existe
    existing_cedula = await User.find_one(User.cedula == data.cedula)
    if existing_cedula:
        await log_audit_event(
            event="register_patient_failed",
            user_email=data.email,
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            user_id=str(current_user.id),
            details={"reason": "cedula_already_exists"}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Cedula already registered"}
        )
    
    # Generar contraseña temporal
    temporary_password = generate_temporary_password()
    
    # Crear usuario paciente con datos demográficos
    new_user = User(
        email=data.email,
        password_hash=hash_password(temporary_password),
        fullName=data.fullName,
        cedula=data.cedula,
        role=UserRole.PACIENTE,
        status=UserStatus.ACTIVO,
        fechaNacimiento=data.fechaNacimiento,
        telefonoContacto=data.telefonoContacto,
        direccion=data.direccion,
        ciudad=data.ciudad,
        pais=data.pais,
        genero=data.genero,
        estadoCivil=data.estadoCivil,
        ocupacion=data.ocupacion,
        grupoSanguineo=data.grupoSanguineo,
        permissions=["view_own_records", "view_appointments", "message_doctor"],
        member_since=datetime.utcnow().strftime("%B %Y")
    )
    
    await new_user.insert()
    
    # Crear PatientHistory inicial con datos demográficos
    from models.models import MedicoAsignado, ContactoEmergencia
    patient_history = PatientHistory(
        patient_id=str(new_user.id),
        tipoSangre=data.grupoSanguineo or "No especificado",
        alergias=[],
        condicionesCronicas=[],
        medicamentosActuales=[],
        medicoAsignado=MedicoAsignado(
            nombre="Por asignar",
            especialidad="General",
            telefono="N/A"
        ),
        contactoEmergencia=ContactoEmergencia(
            nombre="Por definir",
            relacion="N/A",
            telefono="N/A"
        ),
        consultas=[],
        vacunas=[],
        antecedentesFamiliares=[],
        proximaCita=None
    )
    
    await patient_history.insert()
    
    # Enviar email con contraseña temporal
    try:
        await send_temporary_password_email(
            to_email=data.email,
            full_name=data.fullName,
            temporary_password=temporary_password,
            role="Paciente"
        )
    except EmailServiceError as e:
        await log_audit_event(
            event="email_send_failed",
            user_email=data.email,
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            user_id=str(new_user.id),
            details={"error": str(e)}
        )
    
    await log_audit_event(
        event="patient_registered",
        user_email=data.email,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        user_id=str(new_user.id),
        details={
            "registered_by": str(current_user.id),
            "registered_by_email": current_user.email,
            "role": "Paciente",
            "demographic_data_included": True
        }
    )
    
    return RegisterResponse(
        message="Patient registered successfully",
        user_id=str(new_user.id)
    )   



async def log_audit_event(
    event: str,
    user_email: str,
    ip_address: str,
    user_agent: str,
    user_id: str | None = None,
    details: dict | None = None
):
    """
    Registra un evento en los logs de auditoría
    """
    audit_log = AuditLog(
        event=event,
        user_email=user_email,
        user_id=user_id,
        ip_address=ip_address,
        user_agent=user_agent,
        details=details or {}
    )
    await audit_log.insert()
    