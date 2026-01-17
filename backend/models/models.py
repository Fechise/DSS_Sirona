from typing import Optional, List
from datetime import datetime, date
from enum import Enum
import pymongo
from beanie import Document, Indexed
from pydantic import BaseModel, Field, EmailStr

# ======================================================
# ENUMS Y SUB-MODELOS COMPARTIDOS
# ======================================================

# --- ENUMS (Para restringir valores) ---
class UserRole(str, Enum):
    ADMINISTRADOR = "Administrador"
    MEDICO = "Médico"
    PACIENTE = "Paciente"
    SECRETARIO = "Secretario"

class UserStatus(str, Enum):
    ACTIVO = "Activo"
    INACTIVO = "Inactivo"
    BLOQUEADO = "Bloqueado"

# --- SUB-MODELOS USUARIO ---
class SecuritySettings(BaseModel):
    mfa_enabled: bool = False
    mfa_secret: Optional[str] = None
    failed_attempts: int = 0
    lockout_until: Optional[datetime] = None

# --- SUB-MODELOS HISTORIAL PACIENTE ---
class MedicoAsignado(BaseModel):
    nombre: str
    especialidad: str
    telefono: str

class ContactoEmergencia(BaseModel):
    nombre: str
    relacion: str
    telefono: str

class Consulta(BaseModel):
    id: str
    fecha: date
    motivo: str
    diagnostico: str
    tratamiento: str
    notasMedico: str

class Vacuna(BaseModel):
    nombre: str
    fecha: date
    proximaDosis: Optional[date] = None

class ProximaCita(BaseModel):
    fecha: datetime
    motivo: str
    medico: str

# --- SUB-MODELOS REGISTRO CLÍNICO (VISTA MÉDICO) ---
class HistoriaSocial(BaseModel):
    tabaquismo: str
    alcohol: str
    ocupacion: str
    actividadFisica: str

class RevisionSistema(BaseModel):
    sistema: str
    hallazgos: str

class SignosVitales(BaseModel):
    tensionArterial: str
    frecuenciaCardiaca: str
    temperatura: str
    frecuenciaRespiratoria: str
    saturacion: str

class HallazgosExamen(BaseModel):
    general: str
    cardiovascular: str
    respiratorio: str
    abdomen: str
    neurologico: str

class ExamenFisico(BaseModel):
    signosVitales: SignosVitales
    hallazgos: HallazgosExamen

class Laboratorio(BaseModel):
    prueba: str
    valor: str
    unidad: str
    referencia: str
    fecha: date

class Imagen(BaseModel):
    estudio: str
    fecha: date
    impresion: str

class Seguimiento(BaseModel):
    fecha: date
    instrucciones: str

# ======================================================
# BASE DE DATOS 1: IDENTIDAD (sirona_auth)
# ======================================================

# 1. Colección de Usuarios (Credenciales)
class User(Document):
    email: Indexed(EmailStr, unique=True)
    password_hash: str
    fullName: str
    cedula: Indexed(str, unique=True)
    role: UserRole
    status: UserStatus = UserStatus.ACTIVO
    
    # Campos específicos por rol (opcionales)
    especialidad: Optional[str] = None  # Para Médico
    numeroLicencia: Optional[str] = None  # Para Médico
    fechaNacimiento: Optional[date] = None  # Para Paciente
    telefonoContacto: Optional[str] = None  # Para Paciente
    departamento: Optional[str] = None  # Para Secretario
    
    # Campos demográficos adicionales (Para Paciente)
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    pais: Optional[str] = None
    genero: Optional[str] = None
    estadoCivil: Optional[str] = None
    ocupacion: Optional[str] = None
    grupoSanguineo: Optional[str] = None
    
    # Permisos
    permissions: List[str] = []
    
    # Seguridad
    security: SecuritySettings = SecuritySettings()
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    member_since: str = ""

    class Settings:
        name = "users"
        indexes = [
            [("email", pymongo.ASCENDING)],
            [("cedula", pymongo.ASCENDING)],
            [("role", pymongo.ASCENDING)]
        ]

# 2. Sesiones Activas (Tokens JWT)
class Session(Document):
    user_id: Indexed(str)
    token: str
    refresh_token: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    ip_address: str
    user_agent: str
    
    class Settings:
        name = "sessions"
        indexes = [
            [("user_id", pymongo.ASCENDING)],
            [("token", pymongo.ASCENDING)],
            [("expires_at", pymongo.ASCENDING)]  # TTL index
        ]

# 3. Secretos MFA (Autenticación de Dos Factores)
class MFASecret(Document):
    user_id: Indexed(str, unique=True)
    secret: str  # ENCRIPTADO
    backup_codes: List[str] = []  # ENCRIPTADOS
    enabled: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "mfa_secrets"
        indexes = [
            [("user_id", pymongo.ASCENDING)]
        ]

# ======================================================
# BASE DE DATOS 2: NEGOCIO (sirona_core)
# ======================================================

# 4. Historial Clínico del Paciente (Solo Lectura para Paciente)
class PatientHistory(Document):
    patient_id: Indexed(str, unique=True)  # Referencia al User ID del paciente
    tipoSangre: str
    alergias: List[str] = []
    condicionesCronicas: List[str] = []
    medicamentosActuales: List[str] = []
    medicoAsignado: MedicoAsignado
    contactoEmergencia: ContactoEmergencia
    consultas: List[Consulta] = []
    vacunas: List[Vacuna] = []
    antecedentesFamiliares: List[str] = []
    proximaCita: Optional[ProximaCita] = None
    ultimaModificacion: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "patient_histories"
        indexes = [
            [("patient_id", pymongo.ASCENDING)],
            [("ultimaModificacion", pymongo.DESCENDING)]
        ]

# 5. Registro Clínico Detallado (Vista Médico)
class ClinicalRecord(Document):
    patient_id: Indexed(str)  # Referencia al User ID del paciente
    patientName: str
    patientCedula: str
    doctor_id: str  # Referencia al User ID del médico
    doctorName: str
    
    fecha: date
    motivoConsulta: str
    historiaEnfermedadActual: str
    antecedentesPersonales: List[str] = []
    antecedentesQuirurgicos: List[str] = []
    medicamentos: List[str] = []
    alergias: List[str] = []
    historiaSocial: HistoriaSocial
    antecedentesFamiliares: List[str] = []
    revisionSistemas: List[RevisionSistema] = []
    examenFisico: ExamenFisico
    laboratorios: List[Laboratorio] = []
    imagenes: List[Imagen] = []
    diagnostico: str
    tratamiento: str
    observaciones: str
    seguimiento: Optional[Seguimiento] = None
    
    ultimaModificacion: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "clinical_records"
        indexes = [
            [("patient_id", pymongo.ASCENDING)],
            [("doctor_id", pymongo.ASCENDING)],
            [("fecha", pymongo.DESCENDING)],
            [("ultimaModificacion", pymongo.DESCENDING)]
        ]

# 6. Citas Médicas (Appointments)
class Appointment(Document):
    patient_id: Indexed(str)  # ID del paciente
    patientName: str
    doctor_id: Indexed(str)  # ID del médico
    doctorName: str
    fecha: datetime  # Fecha y hora de la cita
    motivo: str
    estado: str  # Programada, Completada, Cancelada, No Asistió
    notas: Optional[str] = None
    created_by: str  # ID del secretario que creó la cita
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "appointments"
        indexes = [
            [("patient_id", pymongo.ASCENDING)],
            [("doctor_id", pymongo.ASCENDING)],
            [("fecha", pymongo.ASCENDING)],
            [("estado", pymongo.ASCENDING)]
        ]


# 7. Disponibilidad de Médicos (Schedule)
class DoctorAvailability(Document):
    doctor_id: Indexed(str)  # ID del médico
    doctorName: str
    fecha: date  # Fecha específica de disponibilidad (YYYY-MM-DD)
    horaInicio: str  # Formato "HH:MM" (ej: "08:00")
    horaFin: str  # Formato "HH:MM" (ej: "17:00")
    duracionCita: int = 30  # Duración de cada cita en minutos
    activo: bool = True  # Si el horario está activo
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "doctor_availability"
        indexes = [
            [("doctor_id", pymongo.ASCENDING)],
            [("fecha", pymongo.ASCENDING)],
            [("activo", pymongo.ASCENDING)]
        ]

# ======================================================
# BASE DE DATOS 3: AUDITORÍA (sirona_logs)
# ======================================================

# 7. Logs de Auditoría (WORM - Write Once, Read Many)
# CRÍTICO: Esta colección debe tener permisos de SOLO ESCRITURA
class AuditLog(Document):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    event: str  # login_failed, login_success, password_change, role_change, etc.
    user_email: Optional[str] = None
    user_id: Optional[str] = None
    ip_address: str
    user_agent: str
    details: dict = {}
    
    class Settings:
        name = "audit_logs"
        indexes = [
            [("timestamp", pymongo.DESCENDING)],
            [("event", pymongo.ASCENDING)],
            [("user_email", pymongo.ASCENDING)]
        ]