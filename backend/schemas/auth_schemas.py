from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date


# --- LOGIN ---
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    token: str
    role: str
    requires_mfa: bool = False


class LoginMFAResponse(BaseModel):
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
    email: EmailStr
    otp: str


class OTPVerifyResponse(BaseModel):
    token: str
    role: str


# --- ERROR RESPONSES ---
class ErrorResponse(BaseModel):
    error: str
    details: Optional[list[str]] = None
