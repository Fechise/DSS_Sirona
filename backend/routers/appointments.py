from fastapi import APIRouter, HTTPException, status, Depends, Request, Query
from typing import List
from datetime import datetime, timedelta, time

from models.models import Appointment, User, UserRole, AuditLog, DoctorAvailability
from schemas.appointment_schemas import (
    AppointmentCreateRequest,
    AppointmentUpdateRequest,
    AppointmentResponse,
    DoctorAvailabilityRequest,
    DoctorAvailabilityResponse,
    AvailableSlotResponse,
    DoctorScheduleResponse
)
from schemas.user_schemas import DoctorMinimalResponse
from services.auth import get_secretary_user, get_current_user

router = APIRouter()


async def check_doctor_availability(doctor_id: str, fecha: datetime) -> bool:
    """
    Verifica si un médico está disponible en una fecha y hora específica.
    """
    # Extraer la fecha sin hora
    fecha_solo = fecha.date()
    hora_cita = fecha.time()
    
    # Buscar disponibilidad del médico para esa fecha específica
    availability = await DoctorAvailability.find_one(
        DoctorAvailability.doctor_id == doctor_id,
        DoctorAvailability.fecha == fecha_solo,
        DoctorAvailability.activo == True
    )
    
    if not availability:
        return False
    
    # Convertir strings a time objects
    hora_inicio = time.fromisoformat(availability.horaInicio)
    hora_fin = time.fromisoformat(availability.horaFin)
    
    # Verificar si la hora de la cita está dentro del horario
    if not (hora_inicio <= hora_cita < hora_fin):
        return False
    
    # Verificar que no haya otra cita en ese horario
    # Buscar citas existentes en una ventana de ±duracionCita minutos
    inicio_ventana = fecha - timedelta(minutes=availability.duracionCita)
    fin_ventana = fecha + timedelta(minutes=availability.duracionCita)
    
    existing_appointment = await Appointment.find_one(
        Appointment.doctor_id == doctor_id,
        Appointment.fecha >= inicio_ventana,
        Appointment.fecha < fin_ventana,
        Appointment.estado.in_(["Programada", "En Progreso"])
    )
    
    return existing_appointment is None


@router.post("/appointments", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    data: AppointmentCreateRequest,
    request: Request,
    current_user: User = Depends(get_secretary_user)
):
    """
    Crear una nueva cita médica.
    Solo secretarios pueden crear citas.
    """
    # Verificar que el paciente existe
    patient = await User.get(data.patient_id)
    if not patient or patient.role != UserRole.PACIENTE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Verificar que el médico existe
    doctor = await User.get(data.doctor_id)
    if not doctor or doctor.role != UserRole.MEDICO:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    # Verificar disponibilidad del médico
    is_available = await check_doctor_availability(data.doctor_id, data.fecha)
    if not is_available:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Doctor is not available at the requested time. Please check the doctor's schedule."
        )
    
    # Crear la cita
    appointment = Appointment(
        patient_id=data.patient_id,
        patientName=patient.fullName,
        doctor_id=data.doctor_id,
        doctorName=doctor.fullName,
        fecha=data.fecha,
        motivo=data.motivo,
        estado="Programada",
        notas=data.notas,
        created_by=str(current_user.id)
    )
    
    await appointment.insert()
    
    # Log de auditoría
    audit_log = AuditLog(
        event="appointment_created",
        user_email=current_user.email,
        user_id=str(current_user.id),
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        details={
            "appointment_id": str(appointment.id),
            "patient_id": data.patient_id,
            "doctor_id": data.doctor_id,
            "fecha": data.fecha.isoformat()
        }
    )
    await audit_log.insert()
    
    return AppointmentResponse(
        id=str(appointment.id),
        patient_id=appointment.patient_id,
        patientName=appointment.patientName,
        doctor_id=appointment.doctor_id,
        doctorName=appointment.doctorName,
        fecha=appointment.fecha,
        motivo=appointment.motivo,
        estado=appointment.estado,
        notas=appointment.notas,
        created_at=appointment.created_at,
        updated_at=appointment.updated_at
    )


@router.get("/appointments", response_model=List[AppointmentResponse])
async def list_appointments(
    current_user: User = Depends(get_secretary_user),
    patient_id: str = None,
    doctor_id: str = None,
    estado: str = None
):
    """
    Listar citas médicas con filtros opcionales.
    Solo secretarios pueden listar todas las citas.
    """
    query = {}
    
    if patient_id:
        query["patient_id"] = patient_id
    if doctor_id:
        query["doctor_id"] = doctor_id
    if estado:
        query["estado"] = estado
    
    appointments = await Appointment.find(query).to_list()
    
    return [
        AppointmentResponse(
            id=str(apt.id),
            patient_id=apt.patient_id,
            patientName=apt.patientName,
            doctor_id=apt.doctor_id,
            doctorName=apt.doctorName,
            fecha=apt.fecha,
            motivo=apt.motivo,
            estado=apt.estado,
            notas=apt.notas,
            created_at=apt.created_at,
            updated_at=apt.updated_at
        )
        for apt in appointments
    ]


@router.get("/appointments/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(
    appointment_id: str,
    current_user: User = Depends(get_secretary_user)
):
    """
    Obtener una cita específica por ID.
    Solo secretarios.
    """
    appointment = await Appointment.get(appointment_id)
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    return AppointmentResponse(
        id=str(appointment.id),
        patient_id=appointment.patient_id,
        patientName=appointment.patientName,
        doctor_id=appointment.doctor_id,
        doctorName=appointment.doctorName,
        fecha=appointment.fecha,
        motivo=appointment.motivo,
        estado=appointment.estado,
        notas=appointment.notas,
        created_at=appointment.created_at,
        updated_at=appointment.updated_at
    )


@router.put("/appointments/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: str,
    data: AppointmentUpdateRequest,
    request: Request,
    current_user: User = Depends(get_secretary_user)
):
    """
    Actualizar una cita existente.
    Solo secretarios.
    """
    appointment = await Appointment.get(appointment_id)
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Actualizar campos si se proporcionan
    if data.fecha:
        appointment.fecha = data.fecha
    if data.motivo:
        appointment.motivo = data.motivo
    if data.estado:
        appointment.estado = data.estado
    if data.notas is not None:
        appointment.notas = data.notas
    
    appointment.updated_at = datetime.utcnow()
    await appointment.save()
    
    # Log de auditoría
    audit_log = AuditLog(
        event="appointment_updated",
        user_email=current_user.email,
        user_id=str(current_user.id),
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        details={
            "appointment_id": str(appointment.id),
            "changes": data.dict(exclude_unset=True)
        }
    )
    await audit_log.insert()
    
    return AppointmentResponse(
        id=str(appointment.id),
        patient_id=appointment.patient_id,
        patientName=appointment.patientName,
        doctor_id=appointment.doctor_id,
        doctorName=appointment.doctorName,
        fecha=appointment.fecha,
        motivo=appointment.motivo,
        estado=appointment.estado,
        notas=appointment.notas,
        created_at=appointment.created_at,
        updated_at=appointment.updated_at
    )


@router.delete("/appointments/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_appointment(
    appointment_id: str,
    request: Request,
    current_user: User = Depends(get_secretary_user)
):
    """
    Eliminar una cita.
    Solo secretarios.
    """
    appointment = await Appointment.get(appointment_id)
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Log de auditoría antes de eliminar
    audit_log = AuditLog(
        event="appointment_deleted",
        user_email=current_user.email,
        user_id=str(current_user.id),
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        details={
            "appointment_id": str(appointment.id),
            "patient_id": appointment.patient_id,
            "doctor_id": appointment.doctor_id
        }
    )
    await audit_log.insert()
    
    await appointment.delete()
    
    return None


# ==================== DISPONIBILIDAD DE MÉDICOS ====================

@router.get("/doctors", response_model=List[DoctorMinimalResponse])
async def list_doctors(
    current_user: User = Depends(get_secretary_user)
):
    """
    Listar todos los médicos con datos mínimos.
    Solo secretarios pueden acceder.
    """
    doctors = await User.find(User.role == UserRole.MEDICO).to_list()
    
    return [
        DoctorMinimalResponse(
            id=str(doctor.id),
            fullName=doctor.fullName,
            especialidad=doctor.especialidad,
            numeroLicencia=doctor.numeroLicencia,
            email=doctor.email
        )
        for doctor in doctors
    ]


@router.get("/doctors/{doctor_id}/availability", response_model=List[DoctorAvailabilityResponse])
async def get_doctor_availability(
    doctor_id: str,
    current_user: User = Depends(get_secretary_user)
):
    """
    Obtener la disponibilidad de un médico.
    Solo secretarios pueden consultar disponibilidad.
    """
    # Verificar que el médico existe
    doctor = await User.get(doctor_id)
    if not doctor or doctor.role != UserRole.MEDICO:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    # Obtener disponibilidad
    availabilities = await DoctorAvailability.find(
        DoctorAvailability.doctor_id == doctor_id,
        DoctorAvailability.activo == True
    ).to_list()
    
    return [
        DoctorAvailabilityResponse(
            id=str(av.id),
            doctor_id=av.doctor_id,
            doctorName=av.doctorName,
            fecha=av.fecha.isoformat(),
            horaInicio=av.horaInicio,
            horaFin=av.horaFin,
            duracionCita=av.duracionCita,
            activo=av.activo,
            created_at=av.created_at
        )
        for av in availabilities
    ]


@router.get("/doctors/{doctor_id}/schedule", response_model=DoctorScheduleResponse)
async def get_doctor_schedule(
    doctor_id: str,
    fecha: str = Query(..., description="Fecha en formato YYYY-MM-DD"),
    current_user: User = Depends(get_secretary_user)
):
    """
    Obtener los horarios disponibles de un médico para una fecha específica.
    Solo secretarios pueden consultar horarios.
    """
    # Verificar que el médico existe
    doctor = await User.get(doctor_id)
    if not doctor or doctor.role != UserRole.MEDICO:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    # Parsear fecha
    try:
        fecha_obj = datetime.strptime(fecha, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    
    # Buscar disponibilidad del médico para esa fecha específica
    availability = await DoctorAvailability.find_one(
        DoctorAvailability.doctor_id == doctor_id,
        DoctorAvailability.fecha == fecha_obj,
        DoctorAvailability.activo == True
    )
    
    if not availability:
        return DoctorScheduleResponse(
            doctor_id=doctor_id,
            doctorName=doctor.fullName,
            fecha=fecha,
            slots=[]
        )
    
    # Generar slots de tiempo
    hora_inicio = time.fromisoformat(availability.horaInicio)
    hora_fin = time.fromisoformat(availability.horaFin)
    duracion = availability.duracionCita
    
    slots = []
    current_time = datetime.combine(fecha_obj, hora_inicio)
    end_time = datetime.combine(fecha_obj, hora_fin)
    
    while current_time < end_time:
        # Verificar si el slot está disponible
        is_available = await check_doctor_availability(doctor_id, current_time)
        
        slots.append(AvailableSlotResponse(
            fecha=current_time,
            disponible=is_available
        ))
        
        current_time += timedelta(minutes=duracion)
    
    return DoctorScheduleResponse(
        doctor_id=doctor_id,
        doctorName=doctor.fullName,
        fecha=fecha,
        slots=slots
    )


@router.post("/doctors/{doctor_id}/availability", response_model=DoctorAvailabilityResponse, status_code=status.HTTP_201_CREATED)
async def create_doctor_availability(
    doctor_id: str,
    data: DoctorAvailabilityRequest,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Crear horario de disponibilidad para un médico.
    Solo administradores o el mismo médico pueden crear su disponibilidad.
    """
    # Verificar permisos
    if current_user.role not in [UserRole.ADMINISTRADOR, UserRole.MEDICO]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only administrators or doctors can create availability."
        )
    
    # Si es médico, solo puede crear su propia disponibilidad
    if current_user.role == UserRole.MEDICO and str(current_user.id) != doctor_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You can only create your own availability."
        )
    
    # Verificar que el médico existe
    doctor = await User.get(doctor_id)
    if not doctor or doctor.role != UserRole.MEDICO:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    # Validar y parsear fecha
    try:
        fecha_obj = datetime.strptime(data.fecha, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    
    # Validar formato de horas
    try:
        time.fromisoformat(data.horaInicio)
        time.fromisoformat(data.horaFin)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid time format. Use HH:MM format"
        )
    
    # Verificar que no exista disponibilidad para esa fecha
    existing = await DoctorAvailability.find_one(
        DoctorAvailability.doctor_id == doctor_id,
        DoctorAvailability.fecha == fecha_obj,
        DoctorAvailability.activo == True
    )
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Availability already exists for this date. Please update or delete the existing one."
        )
    
    # Crear disponibilidad
    availability = DoctorAvailability(
        doctor_id=doctor_id,
        doctorName=doctor.fullName,
        fecha=fecha_obj,
        horaInicio=data.horaInicio,
        horaFin=data.horaFin,
        duracionCita=data.duracionCita,
        activo=True
    )
    
    await availability.insert()
    
    # Log de auditoría
    audit_log = AuditLog(
        event="doctor_availability_created",
        user_email=current_user.email,
        user_id=str(current_user.id),
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        details={
            "availability_id": str(availability.id),
            "doctor_id": doctor_id,
            "fecha": data.fecha
        }
    )
    await audit_log.insert()
    
    return DoctorAvailabilityResponse(
        id=str(availability.id),
        doctor_id=availability.doctor_id,
        doctorName=availability.doctorName,
        fecha=availability.fecha.isoformat(),
        horaInicio=availability.horaInicio,
        horaFin=availability.horaFin,
        duracionCita=availability.duracionCita,
        activo=availability.activo,
        created_at=availability.created_at
    )
