from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, time


# --- APPOINTMENTS (CITAS) ---
class AppointmentCreateRequest(BaseModel):
    patient_id: str
    doctor_id: str
    fecha: datetime
    motivo: str
    notas: Optional[str] = None


class AppointmentUpdateRequest(BaseModel):
    fecha: Optional[datetime] = None
    motivo: Optional[str] = None
    estado: Optional[str] = None  # Programada, Completada, Cancelada, No Asistió
    notas: Optional[str] = None


class AppointmentResponse(BaseModel):
    id: str
    patient_id: str
    patientName: str
    doctor_id: str
    doctorName: str
    fecha: datetime
    motivo: str
    estado: str
    notas: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- DOCTOR AVAILABILITY (DISPONIBILIDAD) ---
class DoctorAvailabilityRequest(BaseModel):
    fecha: str  # Fecha específica en formato YYYY-MM-DD
    horaInicio: str  # Formato "HH:MM"
    horaFin: str  # Formato "HH:MM"
    duracionCita: int = 30  # Minutos


class DoctorAvailabilityResponse(BaseModel):
    id: str
    doctor_id: str
    doctorName: str
    fecha: str  # Formato YYYY-MM-DD
    horaInicio: str
    horaFin: str
    duracionCita: int
    activo: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AvailableSlotResponse(BaseModel):
    fecha: datetime
    disponible: bool


class DoctorScheduleResponse(BaseModel):
    doctor_id: str
    doctorName: str
    fecha: str  # YYYY-MM-DD
    slots: List[AvailableSlotResponse]
