from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date


# --- LOGIN ---
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserInfo(BaseModel):
    email: str
    fullName: str
    cedula: str
    role: str
    status: str


class LoginResponse(BaseModel):
    """Respuesta de login exitoso (después de verificar MFA)"""
    token: str
    role: str
    requires_mfa: bool = False
    user: Optional[UserInfo] = None


class LoginMFARequiredResponse(BaseModel):
    """
    Respuesta cuando el usuario necesita verificar MFA.
    Si mfa_setup_required es True, el usuario debe configurar su app de autenticación.
    """
    requires_mfa: bool = True
    mfa_setup_required: bool = False  # True si es primera vez y necesita escanear QR
    temp_token: str  # Token temporal para completar MFA
    message: str = "Please verify with MFA"
    qr_code: Optional[str] = None  # QR en base64 si mfa_setup_required es True
    secret_key: Optional[str] = None  # Secreto manual si no puede escanear QR


class LoginMFAResponse(BaseModel):
    """Respuesta legacy - mantener compatibilidad"""
    requires_mfa: bool = True
    message: str = "Please verify with MFA"


class AccountLockedResponse(BaseModel):
    account_locked: bool = True
    locked_until: datetime
    message: str = "Account locked due to too many failed login attempts"


# --- REGISTER ---
class RegisterDoctorRequest(BaseModel):
    email: EmailStr
    fullName: str
    cedula: str
    especialidad: str
    numeroLicencia: str


class RegisterSecretaryRequest(BaseModel):
    email: EmailStr
    fullName: str
    cedula: str
    departamento: str


class RegisterPatientRequest(BaseModel):
    email: EmailStr
    fullName: str
    cedula: str
    fechaNacimiento: date
    telefonoContacto: str
    # Campos demográficos adicionales
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    pais: Optional[str] = ""
    genero: Optional[str] = None
    estadoCivil: Optional[str] = None
    ocupacion: Optional[str] = None
    grupoSanguineo: Optional[str] = None


class RegisterResponse(BaseModel):
    message: str
    user_id: str


# --- CHANGE PASSWORD ---
class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str


class ChangePasswordResponse(BaseModel):
    message: str


# --- OTP ---
class OTPVerifyRequest(BaseModel):
    """Request para verificar código OTP (login o setup)"""
    temp_token: str  # Token temporal del paso de login
    otp_code: str = Field(..., min_length=6, max_length=6, pattern=r'^\d{6}$')


class OTPSetupVerifyRequest(BaseModel):
    """Request para verificar y completar setup de MFA"""
    temp_token: str
    otp_code: str = Field(..., min_length=6, max_length=6, pattern=r'^\d{6}$')


class OTPVerifyResponse(BaseModel):
    """Respuesta exitosa de verificación OTP"""
    token: str
    role: str
    user: Optional[UserInfo] = None
    message: str = "MFA verification successful"


class MFASetupResponse(BaseModel):
    """Respuesta con datos para configurar MFA"""
    qr_code: str  # Imagen QR en base64
    secret_key: str  # Secreto para ingreso manual
    message: str = "Scan QR code with your authenticator app"


# --- ERROR RESPONSES ---
class ErrorResponse(BaseModel):
    error: str
    details: Optional[list[str]] = None
