from fastapi import APIRouter, HTTPException, status, Depends, Request
from typing import List, Optional
from datetime import datetime, date

from models.models import PatientHistory, User, UserRole, AuditLog, Consulta, MedicoAsignado, ContactoEmergencia
from schemas.patient_schemas import (
    PatientHistoryResponse,
    ConsultaCreateRequest,
    ConsultaUpdateRequest,
    ConsultaResponse,
    MedicoAsignadoResponse,
    ContactoEmergenciaResponse,
    VacunaResponse,
    ProximaCitaResponse,
    PatientHistoryUpdateRequest,
    PatientMinimalResponse
)
from services.auth import get_current_user

router = APIRouter()


@router.get("/listado-pacientes")
async def list_patients_minimal(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Listar pacientes con datos mínimos para agendamiento de citas.
    Secretarios y Administradores pueden acceder a este listado.
    """
    # Verificar que el usuario es un secretario o administrador
    if current_user.role not in [UserRole.SECRETARIO, UserRole.ADMINISTRADOR]:
        audit_log = AuditLog(
            event="unauthorized_patient_list_access",
            user_email=current_user.email,
            user_id=str(current_user.id),
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            details={"reason": "not_authorized", "role": current_user.role.value}
        )
        await audit_log.insert()
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only secretaries and administrators can access patient list."
        )
    
    # Obtener todos los pacientes (solo usuarios con rol PACIENTE)
    patients = await User.find({"role": UserRole.PACIENTE.value}).to_list()
    
    # Log de auditoría
    audit_log = AuditLog(
        event="patient_list_viewed",
        user_email=current_user.email,
        user_id=str(current_user.id),
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        details={"total_patients": len(patients)}
    )
    await audit_log.insert()
    
    # Retornar datos con estructura esperada por el frontend
    return {
        "total": len(patients),
        "patients": [
            {
                "id": str(patient.id),
                "fullName": patient.fullName,
                "cedula": patient.cedula,
                "fechaNacimiento": patient.fechaNacimiento.isoformat() if patient.fechaNacimiento else None,
                "telefonoContacto": patient.telefonoContacto,
                "email": patient.email,
                "status": patient.status.value if patient.status else "Activo"
            }
            for patient in patients
        ]
    }


@router.get("/mi-historial", response_model=PatientHistoryResponse)
async def get_my_history(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Obtener el historial clínico del paciente autenticado.
    Solo pacientes pueden ver su propio historial.
    """
    # Verificar que el usuario es un paciente
    if current_user.role != UserRole.PACIENTE:
        # Log de auditoría para intento no autorizado
        audit_log = AuditLog(
            event="unauthorized_history_access",
            user_email=current_user.email,
            user_id=str(current_user.id),
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            details={"reason": "not_a_patient", "role": current_user.role.value}
        )
        await audit_log.insert()
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. This action is not permitted."
        )
    
    # Buscar historial del paciente
    history = await PatientHistory.find_one({"patient_id": str(current_user.id)})
    
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medical history not found"
        )
    
    # Log de auditoría para acceso exitoso
    audit_log = AuditLog(
        event="patient_history_viewed",
        user_email=current_user.email,
        user_id=str(current_user.id),
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        details={"history_id": str(history.id)}
    )
    await audit_log.insert()
    
    # Construir response
    return PatientHistoryResponse(
        id=str(history.id),
        tipoSangre=history.tipoSangre,
        alergias=history.alergias,
        condicionesCronicas=history.condicionesCronicas,
        medicamentosActuales=history.medicamentosActuales,
        medicoAsignado=MedicoAsignadoResponse(**history.medicoAsignado.dict()),
        contactoEmergencia=ContactoEmergenciaResponse(**history.contactoEmergencia.dict()),
        consultas=[
            ConsultaResponse(
                id=c.id,
                fecha=c.fecha,
                motivo=c.motivo,
                diagnostico=c.diagnostico,
                tratamiento=c.tratamiento,
                notasMedico=c.notasMedico
            )
            for c in history.consultas
        ],
        vacunas=[
            VacunaResponse(**v.dict())
            for v in history.vacunas
        ],
        antecedentesFamiliares=history.antecedentesFamiliares,
        proximaCita=ProximaCitaResponse(**history.proximaCita.dict()) if history.proximaCita else None,
        ultimaModificacion=history.ultimaModificacion
    )


@router.get("/pacientes/{patient_id}/historial", response_model=PatientHistoryResponse)
async def get_patient_history(
    patient_id: str,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Obtener el historial clínico de un paciente específico.
    Solo médicos pueden ver historiales de sus pacientes asignados.
    """
    # Verificar que el usuario es un médico
    if current_user.role != UserRole.MEDICO:
        audit_log = AuditLog(
            event="unauthorized_history_access",
            user_email=current_user.email,
            user_id=str(current_user.id),
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            details={"reason": "not_a_doctor", "role": current_user.role.value, "attempted_patient": patient_id}
        )
        await audit_log.insert()
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only doctors can view patient histories."
        )
    
    # Verificar que el paciente existe
    patient = await User.get(patient_id)
    if not patient or patient.role != UserRole.PACIENTE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Buscar historial del paciente
    history = await PatientHistory.find_one({"patient_id": patient_id})
    
    # Si no existe historial, crear uno automáticamente
    if not history:
        history = PatientHistory(
            patient_id=patient_id,
            tipoSangre="No especificado",
            alergias=[],
            condicionesCronicas=[],
            medicamentosActuales=[],
            medicoAsignado=MedicoAsignado(
                nombre=current_user.fullName,
                especialidad=current_user.especialidad or "General",
                telefono=current_user.telefonoContacto or ""
            ),
            contactoEmergencia=ContactoEmergencia(
                nombre="No registrado",
                relacion="",
                telefono=""
            ),
            consultas=[],
            vacunas=[],
            antecedentesFamiliares=[],
            ultimaModificacion=datetime.utcnow()
        )
        
        await history.insert()
        
        # Log de auditoría para creación automática
        audit_log_create = AuditLog(
            event="patient_history_auto_created",
            user_email=current_user.email,
            user_id=str(current_user.id),
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            details={
                "patient_id": patient_id,
                "history_id": str(history.id),
                "doctor_id": str(current_user.id)
            }
        )
        await audit_log_create.insert()
    
    # Verificar que el médico está asignado a este paciente
    # El médico debe estar asignado al paciente para poder ver su historial
    # Si medicoId es None (registro antiguo), usar el nombre para compatibilidad
    assigned_doctor_id = history.medicoAsignado.medicoId or None
    if assigned_doctor_id and assigned_doctor_id != str(current_user.id):
        # Log de auditoría para intento de acceso no autorizado
        audit_log = AuditLog(
            event="unauthorized_patient_access",
            user_email=current_user.email,
            user_id=str(current_user.id),
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            details={
                "reason": "doctor_not_assigned_to_patient",
                "patient_id": patient_id,
                "assigned_doctor_id": history.medicoAsignado.medicoId,
                "assigned_doctor": history.medicoAsignado.nombre,
                "requesting_doctor": current_user.fullName,
                "requesting_doctor_id": str(current_user.id)
            }
        )
        await audit_log.insert()
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You are not assigned to this patient."
        )
    
    # Log de auditoría
    audit_log = AuditLog(
        event="doctor_viewed_patient_history",
        user_email=current_user.email,
        user_id=str(current_user.id),
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        details={
            "patient_id": patient_id,
            "history_id": str(history.id)
        }
    )
    await audit_log.insert()
    
    # Construir response
    return PatientHistoryResponse(
        id=str(history.id),
        tipoSangre=history.tipoSangre,
        alergias=history.alergias,
        condicionesCronicas=history.condicionesCronicas,
        medicamentosActuales=history.medicamentosActuales,
        medicoAsignado=MedicoAsignadoResponse(**history.medicoAsignado.dict()),
        contactoEmergencia=ContactoEmergenciaResponse(**history.contactoEmergencia.dict()),
        consultas=[
            ConsultaResponse(
                id=c.id,
                fecha=c.fecha,
                motivo=c.motivo,
                diagnostico=c.diagnostico,
                tratamiento=c.tratamiento,
                notasMedico=c.notasMedico
            )
            for c in history.consultas
        ],
        vacunas=[
            VacunaResponse(**v.dict())
            for v in history.vacunas
        ],
        antecedentesFamiliares=history.antecedentesFamiliares,
        proximaCita=ProximaCitaResponse(**history.proximaCita.dict()) if history.proximaCita else None,
        ultimaModificacion=history.ultimaModificacion
    )


@router.post("/pacientes/{patient_id}/consultas", response_model=ConsultaResponse, status_code=status.HTTP_201_CREATED)
async def create_consulta(
    patient_id: str,
    data: ConsultaCreateRequest,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Crear una nueva consulta médica para un paciente.
    Solo médicos pueden crear consultas.
    """
    # Verificar que el usuario es un médico
    if current_user.role != UserRole.MEDICO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only doctors can create medical consultations."
        )
    
    # Verificar que el paciente existe
    patient = await User.get(patient_id)
    if not patient or patient.role != UserRole.PACIENTE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Buscar historial del paciente
    history = await PatientHistory.find_one({"patient_id": patient_id})
    
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient history not found. Cannot create consultation."
        )
    
    # Verificar que el médico está asignado a este paciente
    # Si medicoId es None (registro antiguo), no validar estrictamente
    assigned_doctor_id = history.medicoAsignado.medicoId or None
    if assigned_doctor_id and assigned_doctor_id != str(current_user.id):
        audit_log = AuditLog(
            event="unauthorized_consultation_attempt",
            user_email=current_user.email,
            user_id=str(current_user.id),
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            details={
                "reason": "doctor_not_assigned_to_patient",
                "patient_id": patient_id,
                "assigned_doctor_id": history.medicoAsignado.medicoId,
                "assigned_doctor": history.medicoAsignado.nombre,
                "requesting_doctor": current_user.fullName,
                "requesting_doctor_id": str(current_user.id)
            }
        )
        await audit_log.insert()
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You are not assigned to this patient."
        )
    
    # Crear nueva consulta
    nueva_consulta = Consulta(
        id=f"cons_{datetime.utcnow().timestamp()}",
        fecha=date.today(),
        motivo=data.motivo,
        diagnostico=data.diagnostico,
        tratamiento=data.tratamiento,
        notasMedico=data.notasMedico
    )
    
    # Agregar consulta al historial (al inicio para orden DESC)
    history.consultas.insert(0, nueva_consulta)
    history.ultimaModificacion = datetime.utcnow()
    await history.save()
    
    # Log de auditoría
    audit_log = AuditLog(
        event="consultation_created",
        user_email=current_user.email,
        user_id=str(current_user.id),
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        details={
            "patient_id": patient_id,
            "consulta_id": nueva_consulta.id,
            "doctor_name": current_user.fullName
        }
    )
    await audit_log.insert()
    
    return ConsultaResponse(
        id=nueva_consulta.id,
        fecha=nueva_consulta.fecha,
        motivo=nueva_consulta.motivo,
        diagnostico=nueva_consulta.diagnostico,
        tratamiento=nueva_consulta.tratamiento,
        notasMedico=nueva_consulta.notasMedico
    )


@router.get("/pacientes/{patient_id}/consultas", response_model=List[ConsultaResponse])
async def get_patient_consultas(
    patient_id: str,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Obtener todas las consultas de un paciente.
    Pacientes pueden ver sus propias consultas, médicos pueden ver las de sus pacientes.
    """
    # Verificar permisos
    if current_user.role == UserRole.PACIENTE:
        # Pacientes solo pueden ver sus propias consultas
        if str(current_user.id) != patient_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only view your own consultations."
            )
    elif current_user.role == UserRole.MEDICO:
        # Médicos solo pueden ver consultas de sus pacientes asignados
        # Buscar historial primero para verificar asignación
        temp_history = await PatientHistory.find_one({"patient_id": patient_id})
        assigned_doctor_id = temp_history.medicoAsignado.medicoId if temp_history else None
        if temp_history and assigned_doctor_id and assigned_doctor_id != str(current_user.id):
            audit_log = AuditLog(
                event="unauthorized_consultations_access",
                user_email=current_user.email,
                user_id=str(current_user.id),
                ip_address=request.client.host,
                user_agent=request.headers.get("user-agent", ""),
                details={
                    "reason": "doctor_not_assigned_to_patient",
                    "patient_id": patient_id,
                    "assigned_doctor_id": temp_history.medicoAsignado.medicoId,
                    "assigned_doctor": temp_history.medicoAsignado.nombre,
                    "requesting_doctor": current_user.fullName,
                    "requesting_doctor_id": str(current_user.id)
                }
            )
            await audit_log.insert()
            
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You are not assigned to this patient."
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied."
        )
    
    # Buscar historial
    history = await PatientHistory.find_one({"patient_id": patient_id})
    
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient history not found"
        )
    
    # Log de auditoría
    audit_log = AuditLog(
        event="consultations_viewed",
        user_email=current_user.email,
        user_id=str(current_user.id),
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        details={
            "patient_id": patient_id,
            "viewer_role": current_user.role.value
        }
    )
    await audit_log.insert()
    
    return [
        ConsultaResponse(
            id=c.id,
            fecha=c.fecha,
            motivo=c.motivo,
            diagnostico=c.diagnostico,
            tratamiento=c.tratamiento,
            notasMedico=c.notasMedico
        )
        for c in history.consultas
    ]


@router.put("/pacientes/{patient_id}/historial", response_model=PatientHistoryResponse)
async def update_patient_history(
    patient_id: str,
    data: PatientHistoryUpdateRequest,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Actualizar el historial clínico de un paciente.
    Solo el médico asignado al paciente puede actualizar el historial.
    """
    # Verificar que el usuario es un médico
    if current_user.role != UserRole.MEDICO:
        audit_log = AuditLog(
            event="unauthorized_history_update",
            user_email=current_user.email,
            user_id=str(current_user.id),
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            details={"reason": "not_a_doctor", "role": current_user.role.value, "attempted_patient": patient_id}
        )
        await audit_log.insert()
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only doctors can update patient histories."
        )
    
    # Verificar que el paciente existe
    patient = await User.get(patient_id)
    if not patient or patient.role != UserRole.PACIENTE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Buscar historial del paciente
    history = await PatientHistory.find_one({"patient_id": patient_id})
    
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medical history not found"
        )
    
    # Verificar que el médico está asignado a este paciente
    # Si medicoId es None (registro antiguo), no validar estrictamente
    assigned_doctor_id = history.medicoAsignado.medicoId or None
    if assigned_doctor_id and assigned_doctor_id != str(current_user.id):
        audit_log = AuditLog(
            event="unauthorized_history_update",
            user_email=current_user.email,
            user_id=str(current_user.id),
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            details={
                "reason": "doctor_not_assigned_to_patient",
                "patient_id": patient_id,
                "assigned_doctor_id": history.medicoAsignado.medicoId,
                "assigned_doctor": history.medicoAsignado.nombre,
                "requesting_doctor": current_user.fullName,
                "requesting_doctor_id": str(current_user.id)
            }
        )
        await audit_log.insert()
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You are not assigned to this patient."
        )
    
    # Actualizar campos si se proporcionan
    updated_fields = []
    if data.alergias is not None:
        history.alergias = data.alergias
        updated_fields.append("alergias")
    if data.condicionesCronicas is not None:
        history.condicionesCronicas = data.condicionesCronicas
        updated_fields.append("condicionesCronicas")
    if data.medicamentosActuales is not None:
        history.medicamentosActuales = data.medicamentosActuales
        updated_fields.append("medicamentosActuales")
    if data.antecedentesFamiliares is not None:
        history.antecedentesFamiliares = data.antecedentesFamiliares
        updated_fields.append("antecedentesFamiliares")
    
    history.ultimaModificacion = datetime.utcnow()
    await history.save()
    
    # Log de auditoría
    audit_log = AuditLog(
        event="patient_history_updated",
        user_email=current_user.email,
        user_id=str(current_user.id),
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        details={
            "patient_id": patient_id,
            "updated_fields": updated_fields,
            "doctor_name": current_user.fullName
        }
    )
    await audit_log.insert()
    
    # Retornar historial actualizado
    return PatientHistoryResponse(
        id=str(history.id),
        tipoSangre=history.tipoSangre,
        alergias=history.alergias,
        condicionesCronicas=history.condicionesCronicas,
        medicamentosActuales=history.medicamentosActuales,
        medicoAsignado=MedicoAsignadoResponse(**history.medicoAsignado.dict()),
        contactoEmergencia=ContactoEmergenciaResponse(**history.contactoEmergencia.dict()),
        consultas=[
            ConsultaResponse(
                id=c.id,
                fecha=c.fecha,
                motivo=c.motivo,
                diagnostico=c.diagnostico,
                tratamiento=c.tratamiento,
                notasMedico=c.notasMedico
            )
            for c in history.consultas
        ],
        vacunas=[
            VacunaResponse(**v.dict())
            for v in history.vacunas
        ],
        antecedentesFamiliares=history.antecedentesFamiliares,
        proximaCita=ProximaCitaResponse(**history.proximaCita.dict()) if history.proximaCita else None,
        ultimaModificacion=history.ultimaModificacion
    )


@router.post("/pacientes/{patient_id}/historial", response_model=PatientHistoryResponse, status_code=status.HTTP_201_CREATED)
async def create_patient_history(
    patient_id: str,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Crear historial clínico para un paciente.
    Solo médicos pueden crear historiales.
    """
    if current_user.role != UserRole.MEDICO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only doctors can create patient histories."
        )
    
    # Verificar que el paciente existe
    patient = await User.get(patient_id)
    if not patient or patient.role != UserRole.PACIENTE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Verificar que no exista ya un historial
    existing = await PatientHistory.find_one({"patient_id": patient_id})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Patient already has a medical history"
        )
    
    # Crear historial con datos iniciales
    history = PatientHistory(
        patient_id=patient_id,
        tipoSangre="No especificado",
        alergias=[],
        condicionesCronicas=[],
        medicamentosActuales=[],
        medicoAsignado=MedicoAsignado(
            medicoId=str(current_user.id),
            nombre=current_user.fullName,
            especialidad=current_user.especialidad or "General",
            telefono=current_user.telefonoContacto or ""
        ),
        contactoEmergencia=ContactoEmergencia(
            nombre="No registrado",
            relacion="",
            telefono=""
        ),
        consultas=[],
        vacunas=[],
        antecedentesFamiliares=[],
        ultimaModificacion=datetime.utcnow()
    )
    
    await history.insert()
    
    # Log de auditoría
    audit_log = AuditLog(
        event="patient_history_created",
        user_email=current_user.email,
        user_id=str(current_user.id),
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        details={
            "patient_id": patient_id,
            "history_id": str(history.id),
            "doctor_id": str(current_user.id)
        }
    )
    await audit_log.insert()
    
    return PatientHistoryResponse(
        id=str(history.id),
        tipoSangre=history.tipoSangre,
        alergias=history.alergias,
        condicionesCronicas=history.condicionesCronicas,
        medicamentosActuales=history.medicamentosActuales,
        medicoAsignado=MedicoAsignadoResponse(**history.medicoAsignado.dict()),
        contactoEmergencia=ContactoEmergenciaResponse(**history.contactoEmergencia.dict()),
        consultas=[],
        vacunas=[],
        antecedentesFamiliares=history.antecedentesFamiliares,
        proximaCita=None,
        ultimaModificacion=history.ultimaModificacion
    )