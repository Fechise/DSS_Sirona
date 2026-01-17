from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


# --- PATIENT HISTORY (Historial del Paciente) ---
class MedicoAsignadoResponse(BaseModel):
    medicoId: Optional[str] = None
    nombre: str
    especialidad: str
    telefono: str


class ContactoEmergenciaResponse(BaseModel):
    nombre: str
    relacion: str
    telefono: str


class ConsultaResponse(BaseModel):
    id: str
    fecha: date
    motivo: str
    diagnostico: str
    tratamiento: str
    notasMedico: str


class VacunaResponse(BaseModel):
    nombre: str
    fecha: date
    proximaDosis: Optional[date] = None


class ProximaCitaResponse(BaseModel):
    fecha: datetime
    motivo: str
    medico: str


class PatientHistoryResponse(BaseModel):
    id: str
    tipoSangre: str
    alergias: List[str]
    condicionesCronicas: List[str]
    medicamentosActuales: List[str]
    medicoAsignado: MedicoAsignadoResponse
    contactoEmergencia: ContactoEmergenciaResponse
    consultas: List[ConsultaResponse]
    vacunas: List[VacunaResponse]
    antecedentesFamiliares: List[str]
    proximaCita: Optional[ProximaCitaResponse] = None
    ultimaModificacion: datetime

    class Config:
        from_attributes = True


# --- CLINICAL RECORD (Registro Médico) ---
class ConsultaCreateRequest(BaseModel):
    patient_id: str
    motivo: str
    diagnostico: str
    tratamiento: str
    notasMedico: str


class ConsultaUpdateRequest(BaseModel):
    diagnostico: Optional[str] = None
    tratamiento: Optional[str] = None
    notasMedico: Optional[str] = None


class PatientHistoryUpdateRequest(BaseModel):
    """
    Schema para actualizar el historial clínico del paciente.
    Solo médicos asignados pueden actualizar.
    """
    alergias: Optional[List[str]] = None
    condicionesCronicas: Optional[List[str]] = None
    medicamentosActuales: Optional[List[str]] = None
    antecedentesFamiliares: Optional[List[str]] = None


class PatientMinimalResponse(BaseModel):
    """
    Schema con datos mínimos del paciente para agendamiento de citas.
    Solo para uso del secretario.
    """
    id: str
    fullName: str
    cedula: str
    fechaNacimiento: Optional[date] = None
    telefonoContacto: Optional[str] = None
    email: str

    class Config:
        from_attributes = True
