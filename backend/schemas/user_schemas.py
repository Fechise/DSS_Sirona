from pydantic import BaseModel
from typing import Optional
from datetime import date


# --- USER/DOCTOR SCHEMAS ---
class DoctorMinimalResponse(BaseModel):
    """
    Schema con datos mínimos del médico para agendamiento de citas.
    """
    id: str
    fullName: str
    especialidad: Optional[str] = None
    numeroLicencia: Optional[str] = None
    email: str

    class Config:
        from_attributes = True
