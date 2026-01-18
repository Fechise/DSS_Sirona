from fastapi import APIRouter, HTTPException, status, Request, Depends
from datetime import datetime, timedelta
import os

from models.models import User, AuditLog, UserStatus, UserRole, PatientHistory, SecuritySettings
from schemas.auth_schemas import (
    LoginRequest,
    LoginResponse,
    LoginMFAResponse,
    LoginMFARequiredResponse,
    AccountLockedResponse,
    ErrorResponse,
    RegisterDoctorRequest,
    RegisterSecretaryRequest,
    RegisterPatientRequest,
    RegisterResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
    OTPVerifyRequest,
    OTPSetupVerifyRequest,
    OTPVerifyResponse,
    UserInfo
)
from services.security import verify_password, create_access_token, hash_password, validate_password_strength, decode_token
from services.auth import get_admin_user, get_secretary_user, get_current_user
from services.email_service import generate_temporary_password, send_temporary_password_email, EmailServiceError
from services.mfa import mfa_service

router = APIRouter()

# Configuración de bloqueo
MAX_LOGIN_ATTEMPTS = int(os.getenv("MAX_LOGIN_ATTEMPTS", "5"))
LOCKOUT_DURATION_MINUTES = int(os.getenv("LOCKOUT_DURATION_MINUTES", "15"))
# Token temporal para MFA tiene corta duración (5 minutos)
MFA_TEMP_TOKEN_MINUTES = int(os.getenv("MFA_TEMP_TOKEN_MINUTES", "5"))


@router.post("/login")
async def login(login_data: LoginRequest, request: Request):
    """
    Endpoint de login con soporte MFA obligatorio.
    
    FLUJO DE AUTENTICACIÓN:
    1. Validar email/password
    2. Si credenciales válidas:
       - Si usuario NO tiene mfa_secret configurado (primer login):
         → Generar secreto TOTP
         → Devolver QR code + temp_token + mfa_setup_required=True
       - Si usuario YA tiene mfa_secret:
         → Devolver temp_token + requires_mfa=True
    3. Frontend debe llamar a /verify-otp con el código
    
    SEGURIDAD (FIA_UAU.2):
    - Nunca se entrega token JWT hasta verificar MFA
    - Token temporal tiene duración corta (5 min)
    - Token temporal solo sirve para verificar OTP
    """
    
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
    
    # Password válido - reiniciar contador de intentos
    user.security.failed_attempts = 0
    user.security.lockout_until = None
    if user.status == UserStatus.BLOQUEADO:
        user.status = UserStatus.ACTIVO
    
    await log_audit_event(
        event="login_password_verified",
        user_email=user.email,
        user_id=str(user.id),
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        details={"role": user.role.value, "mfa_configured": bool(user.security.mfa_secret)}
    )
    
    # ========== FLUJO MFA OBLIGATORIO ==========
    # Crear token temporal para MFA (corta duración, solo para verificar OTP)
    temp_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "type": "mfa_pending",  # Tipo especial que NO da acceso completo
            "role": user.role.value
        },
        expires_delta=timedelta(minutes=MFA_TEMP_TOKEN_MINUTES)
    )
    
    # Verificar si el usuario ya tiene MFA configurado
    if user.security.mfa_secret:
        # Usuario ya configuró MFA - solo pedir código OTP
        await user.save()
        
        return LoginMFARequiredResponse(
            requires_mfa=True,
            mfa_setup_required=False,
            temp_token=temp_token,
            message="Please enter the verification code from your authenticator app",
            qr_code=None,
            secret_key=None
        )
    else:
        # Primera vez - generar secreto y QR para setup
        new_secret = mfa_service.generate_secret()
        qr_code = mfa_service.generate_qr_code(new_secret, user.email)
        
        # Guardar secreto temporalmente (se confirma cuando verifique OTP)
        # Usamos un campo temporal para no activar MFA hasta verificar
        user.security.mfa_secret = new_secret  # Guardar el secreto
        await user.save()
        
        await log_audit_event(
            event="mfa_setup_initiated",
            user_email=user.email,
            user_id=str(user.id),
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            details={"action": "qr_code_generated"}
        )
        
        return LoginMFARequiredResponse(
            requires_mfa=True,
            mfa_setup_required=True,
            temp_token=temp_token,
            message="Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.) and enter the verification code",
            qr_code=qr_code,
            secret_key=new_secret  # Para ingreso manual si no puede escanear
        )


@router.post("/verify-otp", response_model=OTPVerifyResponse)
async def verify_otp(data: OTPVerifyRequest, request: Request):
    """
    Verificar código OTP y completar autenticación.
    
    Este endpoint se usa tanto para:
    1. Completar setup inicial de MFA (primer login)
    2. Verificar OTP en logins subsecuentes
    
    FLUJO:
    1. Validar temp_token (debe ser tipo 'mfa_pending')
    2. Obtener usuario
    3. Verificar código OTP contra secreto guardado
    4. Si válido: Marcar mfa_enabled=True y generar token JWT completo
    5. Si inválido: Rechazar (no bloquear cuenta, solo limitar intentos)
    
    SEGURIDAD (FIA_UAU.2):
    - Token temporal valida que el usuario ya pasó la autenticación por password
    - Código OTP prueba posesión del dispositivo/app de autenticación
    - Solo después de ambos factores se entrega el token JWT real
    """
    # Validar token temporal
    payload = decode_token(data.temp_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired temporary token. Please login again."
        )
    
    # Verificar que sea un token de tipo MFA pending
    if payload.get("type") != "mfa_pending":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type. Please login again."
        )
    
    # Obtener usuario
    user_id = payload.get("sub")
    user = await User.get(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found. Please login again."
        )
    
    # Verificar que el usuario tenga secreto MFA
    if not user.security.mfa_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA not configured. Please login again to setup MFA."
        )
    
    # Verificar código OTP
    if not mfa_service.verify_otp(user.security.mfa_secret, data.otp_code):
        await log_audit_event(
            event="mfa_verification_failed",
            user_email=user.email,
            user_id=str(user.id),
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            details={"reason": "invalid_otp_code"}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid verification code. Please try again."
        )
    
    # ========== OTP VÁLIDO - COMPLETAR AUTENTICACIÓN ==========
    
    # Si es primera vez, marcar MFA como habilitado
    if not user.security.mfa_enabled:
        user.security.mfa_enabled = True
        await log_audit_event(
            event="mfa_setup_completed",
            user_email=user.email,
            user_id=str(user.id),
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            details={"action": "mfa_enabled"}
        )
    
    # Actualizar último login
    user.last_login = datetime.utcnow()
    await user.save()
    
    # Crear token JWT completo (el real, con acceso total)
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value,
            "type": "access"  # Token de acceso completo
        }
    )
    
    await log_audit_event(
        event="login_success",
        user_email=user.email,
        user_id=str(user.id),
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        details={"role": user.role.value, "mfa_verified": True}
    )
    
    return OTPVerifyResponse(
        token=access_token,
        role=user.role.value,
        user=UserInfo(
            email=user.email,
            fullName=user.fullName,
            cedula=user.cedula,
            role=user.role.value,
            status=user.status.value
        ),
        message="Login successful"
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
    
    # Crear usuario médico con MFA obligatorio
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
        member_since=datetime.utcnow().strftime("%B %Y"),
        security=SecuritySettings(mfa_enabled=True)  # MFA obligatorio
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
    
    # Crear usuario secretario con MFA obligatorio
    new_user = User(
        email=data.email,
        password_hash=hash_password(temporary_password),
        fullName=data.fullName,
        cedula=data.cedula,
        role=UserRole.SECRETARIO,
        status=UserStatus.ACTIVO,
        departamento=data.departamento,
        permissions=["manage_appointments", "view_patient_list", "create_patient_records", "generate_reports"],
        member_since=datetime.utcnow().strftime("%B %Y"),
        security=SecuritySettings(mfa_enabled=True)  # MFA obligatorio
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
    
    # Crear usuario paciente con datos demográficos y MFA obligatorio
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
        member_since=datetime.utcnow().strftime("%B %Y"),
        security=SecuritySettings(mfa_enabled=True)  # MFA obligatorio
    )
    
    await new_user.insert()
    
    # Crear PatientHistory inicial con datos demográficos
    from models.models import MedicoAsignado, ContactoEmergencia
    patient_history = PatientHistory(
        patient_id=str(new_user.id),
        # Datos demográficos
        direccion=data.direccion,
        ciudad=data.ciudad,
        pais=data.pais,
        genero=data.genero,
        estadoCivil=data.estadoCivil,
        ocupacion=data.ocupacion,
        # Información médica
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


@router.post("/change-password", response_model=ChangePasswordResponse)
async def change_password(
    data: ChangePasswordRequest,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Permite a un usuario autenticado cambiar su contraseña.
    Requiere la contraseña actual para validación.
    La nueva contraseña debe cumplir los requisitos de seguridad.
    """
    # Verificar contraseña actual
    if not verify_password(data.currentPassword, current_user.password_hash):
        await log_audit_event(
            event="password_change_failed",
            user_email=current_user.email,
            user_id=str(current_user.id),
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            details={"reason": "invalid_current_password"}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )
    
    # Validar fortaleza de la nueva contraseña (12 chars, uppercase, number, symbol)
    if not validate_password_strength(data.newPassword):
        await log_audit_event(
            event="password_change_failed",
            user_email=current_user.email,
            user_id=str(current_user.id),
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            details={"reason": "weak_password"}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 12 characters long and contain uppercase, number, and special character"
        )
    
    # No permitir reutilizar la misma contraseña
    if verify_password(data.newPassword, current_user.password_hash):
        await log_audit_event(
            event="password_change_failed",
            user_email=current_user.email,
            user_id=str(current_user.id),
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            details={"reason": "password_reuse"}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password"
        )
    
    # Actualizar contraseña (bcrypt con 12 rounds)
    current_user.password_hash = hash_password(data.newPassword)
    current_user.security.password_changed_at = datetime.utcnow()
    await current_user.save()
    
    await log_audit_event(
        event="password_changed",
        user_email=current_user.email,
        user_id=str(current_user.id),
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        details={"changed_by": "user"}
    )
    
    return ChangePasswordResponse(
        message="Password changed successfully"
    )
    