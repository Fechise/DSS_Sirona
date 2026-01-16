from fastapi import APIRouter, HTTPException, status, Depends, Request, Query
from typing import List, Optional
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
    availability = await DoctorAvailability.find_one({
        "doctor_id": doctor_id,
        "fecha": fecha_solo,
        "activo": True
    })
    
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
    
    existing_appointment = await Appointment.find_one({
        "doctor_id": doctor_id,
        "fecha": {"$gte": inicio_ventana, "$lt": fin_ventana},
        "estado": {"$in": ["Programada", "En Progreso"]}
    })
    
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
    doctors = await User.find({"role": UserRole.MEDICO}).to_list()
    
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
        {"doctor_id": doctor_id, "activo": True}
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
    availability = await DoctorAvailability.find_one({
        "doctor_id": doctor_id,
        "fecha": fecha_obj,
        "activo": True
    })
    
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
    existing = await DoctorAvailability.find_one({
        "doctor_id": doctor_id,
        "fecha": fecha_obj,
        "activo": True
    })
    
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


# ==================== DOCTOR SELF-MANAGEMENT ENDPOINTS ====================

@router.get("/doctor/my-availability", response_model=List[DoctorAvailabilityResponse])
async def get_my_availability(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Obtener la disponibilidad del médico autenticado.
    Solo médicos pueden acceder a este endpoint.
    """
    if current_user.role != UserRole.MEDICO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only doctors can access their own availability."
        )
    
    availabilities = await DoctorAvailability.find(
        {"doctor_id": str(current_user.id)}
    ).sort([("fecha", 1)]).to_list()
    
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


@router.post("/doctor/my-availability", response_model=DoctorAvailabilityResponse, status_code=status.HTTP_201_CREATED)
async def create_my_availability(
    data: DoctorAvailabilityRequest,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Crear disponibilidad para el médico autenticado.
    Solo médicos pueden crear su propia disponibilidad.
    """
    if current_user.role != UserRole.MEDICO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only doctors can create their own availability."
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
    existing = await DoctorAvailability.find_one({
        "doctor_id": str(current_user.id),
        "fecha": fecha_obj
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Availability already exists for this date. Please update or delete the existing one."
        )
    
    # Crear disponibilidad
    availability = DoctorAvailability(
        doctor_id=str(current_user.id),
        doctorName=current_user.fullName,
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


@router.put("/doctor/my-availability/{availability_id}", response_model=DoctorAvailabilityResponse)
async def update_my_availability(
    availability_id: str,
    data: DoctorAvailabilityRequest,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Actualizar disponibilidad del médico autenticado.
    Solo el médico propietario puede modificar su disponibilidad.
    """
    if current_user.role != UserRole.MEDICO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only doctors can update their own availability."
        )
    
    availability = await DoctorAvailability.get(availability_id)
    
    if not availability:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Availability not found"
        )
    
    # Verificar que pertenece al médico actual
    if availability.doctor_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You can only update your own availability."
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
    
    # Actualizar
    availability.fecha = fecha_obj
    availability.horaInicio = data.horaInicio
    availability.horaFin = data.horaFin
    availability.duracionCita = data.duracionCita
    
    await availability.save()
    
    # Log de auditoría
    audit_log = AuditLog(
        event="doctor_availability_updated",
        user_email=current_user.email,
        user_id=str(current_user.id),
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        details={
            "availability_id": availability_id,
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


@router.patch("/doctor/my-availability/{availability_id}/toggle", response_model=DoctorAvailabilityResponse)
async def toggle_my_availability(
    availability_id: str,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Activar/desactivar disponibilidad del médico autenticado.
    Permite al médico indicar si está disponible o no en una fecha.
    """
    if current_user.role != UserRole.MEDICO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only doctors can toggle their own availability."
        )
    
    availability = await DoctorAvailability.get(availability_id)
    
    if not availability:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Availability not found"
        )
    
    # Verificar que pertenece al médico actual
    if availability.doctor_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You can only toggle your own availability."
        )
    
    # Toggle activo
    availability.activo = not availability.activo
    await availability.save()
    
    # Log de auditoría
    audit_log = AuditLog(
        event="doctor_availability_toggled",
        user_email=current_user.email,
        user_id=str(current_user.id),
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        details={
            "availability_id": availability_id,
            "activo": availability.activo
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


@router.delete("/doctor/my-availability/{availability_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_availability(
    availability_id: str,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Eliminar disponibilidad del médico autenticado.
    Solo el médico propietario puede eliminar su disponibilidad.
    """
    if current_user.role != UserRole.MEDICO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only doctors can delete their own availability."
        )
    
    availability = await DoctorAvailability.get(availability_id)
    
    if not availability:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Availability not found"
        )
    
    # Verificar que pertenece al médico actual
    if availability.doctor_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You can only delete your own availability."
        )
    
    # Log de auditoría antes de eliminar
    audit_log = AuditLog(
        event="doctor_availability_deleted",
        user_email=current_user.email,
        user_id=str(current_user.id),
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        details={
            "availability_id": availability_id,
            "fecha": availability.fecha.isoformat()
        }
    )
    await audit_log.insert()
    
    await availability.delete()
    
    return None


@router.get("/doctor/my-appointments", response_model=List[AppointmentResponse])
async def get_my_appointments(
    request: Request,
    estado: str = None,
    current_user: User = Depends(get_current_user)
):
    """
    Obtener las citas del médico autenticado.
    Solo médicos pueden acceder a este endpoint.
    """
    if current_user.role != UserRole.MEDICO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only doctors can access their own appointments."
        )
    
    query = {"doctor_id": str(current_user.id)}
    if estado:
        query["estado"] = estado
    
    appointments = await Appointment.find(query).sort([("fecha", 1)]).to_list()
    
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


@router.get("/doctor/my-patients")
async def get_my_patients(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Obtener los pacientes asignados al médico autenticado.
    Basado en las citas que ha tenido el médico.
    """
    from bson import ObjectId
    
    if current_user.role != UserRole.MEDICO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only doctors can access their own patients."
        )
    
    # Buscar todas las citas del médico para obtener pacientes únicos
    appointments = await Appointment.find(
        {"doctor_id": str(current_user.id)}
    ).to_list()
    
    # Obtener IDs únicos de pacientes
    patient_ids = list(set([apt.patient_id for apt in appointments]))
    
    if not patient_ids:
        return {"pacientes": []}
    
    # Buscar datos de los pacientes
    patients = await User.find(
        {"_id": {"$in": [ObjectId(pid) for pid in patient_ids]}}
    ).to_list()
    
    # Contar diagnósticos y última consulta por paciente
    result = []
    for patient in patients:
        patient_appointments = [a for a in appointments if a.patient_id == str(patient.id)]
        
        # Obtener última consulta
        ultima_consulta = None
        if patient_appointments:
            sorted_appointments = sorted(patient_appointments, key=lambda x: x.fecha, reverse=True)
            ultima_consulta = sorted_appointments[0].fecha.isoformat() if sorted_appointments else None
        
        result.append({
            "id": str(patient.id),
            "full_name": patient.fullName,
            "email": patient.email,
            "cedula": patient.cedula,
            "fecha_nacimiento": patient.fechaNacimiento.isoformat() if patient.fechaNacimiento else None,
            "ultima_consulta": ultima_consulta,
            "diagnosticos": len(patient_appointments)
        })
    
    return {"pacientes": result}


@router.get("/patient/my-appointments", response_model=List[AppointmentResponse])
async def get_patient_appointments(
    request: Request,
    estado: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Obtener las citas del paciente autenticado.
    Solo pacientes pueden ver sus propias citas.
    """
    if current_user.role != UserRole.PACIENTE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only patients can access their own appointments."
        )
    
    # Buscar citas del paciente
    query = {"patient_id": str(current_user.id)}
    if estado:
        query["estado"] = estado
    
    appointments = await Appointment.find(query).sort("-fecha").to_list()
    
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


@router.patch("/doctor/appointments/{appointment_id}/complete", response_model=AppointmentResponse)
async def complete_appointment(
    appointment_id: str,
    request: Request,
    notas: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Cerrar/completar una cita con notas opcionales.
    Solo médicos pueden cerrar sus propias citas.
    """
    from bson import ObjectId
    
    if current_user.role != UserRole.MEDICO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only doctors can complete appointments."
        )
    
    try:
        appointment = await Appointment.get(ObjectId(appointment_id))
    except:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Verificar que la cita pertenece al médico
    if appointment.doctor_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. This appointment belongs to another doctor."
        )
    
    # Verificar que la cita no esté ya completada o cancelada
    if appointment.estado in ["Completada", "Cancelada"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot complete appointment. Current status: {appointment.estado}"
        )
    
    # Actualizar estado y notas
    appointment.estado = "Completada"
    if notas:
        appointment.notas = notas
    appointment.updated_at = datetime.utcnow()
    
    await appointment.save()
    
    # Log de auditoría
    audit_log = AuditLog(
        event="appointment_completed",
        user_email=current_user.email,
        user_id=str(current_user.id),
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        details={
            "appointment_id": appointment_id,
            "patient_id": appointment.patient_id,
            "notas": notas
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