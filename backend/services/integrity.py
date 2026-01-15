"""
Servicio de Integridad de Datos - PBI-20
=========================================
Implementa verificación de integridad de historiales médicos usando SHA-256.

Funcionalidades:
- Calcular hash SHA-256 del contenido clínico
- Verificar integridad al leer historiales
- Marcar registros corruptos
- Alertar al administrador en caso de discrepancias

Campos incluidos en el hash (contenido clínico):
- tipoSangre
- alergias
- condicionesCronicas
- medicamentosActuales
- consultas (todas)
- vacunas
- antecedentesFamiliares

Campos EXCLUIDOS (metadata volátil):
- ultimaModificacion
- patient_id
- id
"""

import hashlib
import json
from typing import Optional, Tuple, Dict, Any, List
from datetime import datetime, date
import logging

from models.models import PatientHistory, AuditLog, User, UserRole
from services.audit import audit_logger, AuditEventType

logger = logging.getLogger("sirona.integrity")


class IntegrityService:
    """
    Servicio para verificar y mantener la integridad de los historiales médicos.
    """
    
    @staticmethod
    def _serialize_for_hash(obj: Any) -> Any:
        """
        Serializa objetos de forma determinista para hash reproducible.
        Ordena diccionarios y listas de manera consistente.
        """
        if isinstance(obj, dict):
            # Ordenar claves para consistencia
            return {k: IntegrityService._serialize_for_hash(v) for k, v in sorted(obj.items())}
        elif isinstance(obj, list):
            # Serializar cada elemento
            return [IntegrityService._serialize_for_hash(item) for item in obj]
        elif isinstance(obj, (datetime, date)):
            return obj.isoformat()
        elif hasattr(obj, 'dict'):
            # Objetos Pydantic
            return IntegrityService._serialize_for_hash(obj.dict())
        else:
            return obj
    
    @staticmethod
    def calculate_hash(history: PatientHistory) -> str:
        """
        Calcula el hash SHA-256 del contenido clínico de un historial.
        
        Args:
            history: El historial médico a hashear
            
        Returns:
            String hexadecimal del hash SHA-256
        """
        # Extraer solo los campos clínicos (excluir metadata volátil)
        clinical_content = {
            "tipoSangre": history.tipoSangre,
            "alergias": sorted(history.alergias) if history.alergias else [],
            "condicionesCronicas": sorted(history.condicionesCronicas) if history.condicionesCronicas else [],
            "medicamentosActuales": sorted(history.medicamentosActuales) if history.medicamentosActuales else [],
            "consultas": [
                {
                    "id": c.id,
                    "fecha": c.fecha.isoformat() if isinstance(c.fecha, date) else c.fecha,
                    "motivo": c.motivo,
                    "diagnostico": c.diagnostico,
                    "tratamiento": c.tratamiento,
                    "notasMedico": c.notasMedico
                }
                for c in sorted(history.consultas, key=lambda x: x.id)
            ] if history.consultas else [],
            "vacunas": [
                {
                    "nombre": v.nombre,
                    "fecha": v.fecha.isoformat() if isinstance(v.fecha, date) else v.fecha,
                    "proximaDosis": v.proximaDosis.isoformat() if v.proximaDosis and isinstance(v.proximaDosis, date) else v.proximaDosis
                }
                for v in sorted(history.vacunas, key=lambda x: x.nombre)
            ] if history.vacunas else [],
            "antecedentesFamiliares": sorted(history.antecedentesFamiliares) if history.antecedentesFamiliares else [],
            "medicoAsignado": {
                "nombre": history.medicoAsignado.nombre,
                "especialidad": history.medicoAsignado.especialidad,
                "telefono": history.medicoAsignado.telefono
            } if history.medicoAsignado else None,
            "contactoEmergencia": {
                "nombre": history.contactoEmergencia.nombre,
                "relacion": history.contactoEmergencia.relacion,
                "telefono": history.contactoEmergencia.telefono
            } if history.contactoEmergencia else None
        }
        
        # Serializar de forma determinista
        serialized = IntegrityService._serialize_for_hash(clinical_content)
        json_str = json.dumps(serialized, sort_keys=True, ensure_ascii=False)
        
        # Calcular SHA-256
        hash_obj = hashlib.sha256(json_str.encode('utf-8'))
        return hash_obj.hexdigest()
    
    @staticmethod
    async def verify_integrity(
        history: PatientHistory,
        ip_address: str = "system",
        user_agent: str = "integrity_checker"
    ) -> Tuple[bool, str, str]:
        """
        Verifica la integridad de un historial comparando hashes.
        
        Args:
            history: El historial a verificar
            ip_address: IP para auditoría
            user_agent: User-Agent para auditoría
            
        Returns:
            Tuple de (es_válido, hash_esperado, hash_calculado)
        """
        expected_hash = getattr(history, 'integrity_hash', None) or ""
        calculated_hash = IntegrityService.calculate_hash(history)
        
        # Si no hay hash almacenado, consideramos que no ha sido verificado antes
        if not expected_hash:
            logger.info(f"History {history.id} has no integrity hash. Will be generated on next save.")
            return (True, "", calculated_hash)
        
        is_valid = expected_hash == calculated_hash
        
        # Registrar verificación en auditoría
        await audit_logger.log_integrity_check(
            patient_id=history.patient_id,
            history_id=str(history.id),
            expected_hash=expected_hash,
            calculated_hash=calculated_hash,
            is_valid=is_valid,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        if not is_valid:
            logger.critical(
                f"INTEGRITY VIOLATION detected for history {history.id}! "
                f"Expected: {expected_hash[:16]}..., Got: {calculated_hash[:16]}..."
            )
        
        return (is_valid, expected_hash, calculated_hash)
    
    @staticmethod
    async def update_hash(history: PatientHistory) -> str:
        """
        Calcula y actualiza el hash de integridad del historial.
        Debe llamarse cada vez que se modifica el contenido clínico.
        
        Args:
            history: El historial a actualizar
            
        Returns:
            El nuevo hash calculado
        """
        new_hash = IntegrityService.calculate_hash(history)
        history.integrity_hash = new_hash
        await history.save()
        
        logger.info(f"Updated integrity hash for history {history.id}: {new_hash[:16]}...")
        return new_hash
    
    @staticmethod
    async def mark_as_corrupted(
        history: PatientHistory,
        reason: str,
        ip_address: str = "system"
    ) -> None:
        """
        Marca un historial como potencialmente corrupto.
        
        Args:
            history: El historial a marcar
            reason: Razón de la corrupción detectada
            ip_address: IP para auditoría
        """
        history.is_corrupted = True
        history.corruption_detected_at = datetime.utcnow()
        history.corruption_reason = reason
        await history.save()
        
        # Registrar evento crítico
        await audit_logger.log_event(
            event_type=AuditEventType.HISTORIAL_CORRUPTO,
            patient_id=history.patient_id,
            ip_address=ip_address,
            user_agent="integrity_service",
            details={
                "history_id": str(history.id),
                "reason": reason,
                "action": "MARKED_CORRUPTED"
            }
        )
        
        # TODO: Enviar alerta al administrador (email, notificación, etc.)
        logger.critical(
            f"HISTORIAL MARKED AS CORRUPTED: {history.id} - Reason: {reason}"
        )
    
    @staticmethod
    async def check_access_allowed(
        history: PatientHistory,
        user: User
    ) -> Tuple[bool, Optional[str]]:
        """
        Verifica si el usuario puede acceder al historial.
        Los historiales corruptos solo son accesibles por administradores.
        
        Args:
            history: El historial a verificar
            user: El usuario que intenta acceder
            
        Returns:
            Tuple de (acceso_permitido, mensaje_error)
        """
        is_corrupted = getattr(history, 'is_corrupted', False)
        
        if is_corrupted:
            if user.role == UserRole.ADMINISTRADOR:
                return (True, None)
            else:
                return (False, "Historial bloqueado por problemas de integridad. Contacte al administrador.")
        
        return (True, None)


# Instancia global
integrity_service = IntegrityService()


async def verify_and_get_history(
    history: PatientHistory,
    user: User,
    ip_address: str,
    user_agent: str
) -> Tuple[PatientHistory, bool, Optional[str]]:
    """
    Función de conveniencia que verifica integridad y permisos.
    
    Returns:
        Tuple de (historial, acceso_permitido, mensaje_error)
    """
    # Verificar integridad
    is_valid, _, _ = await integrity_service.verify_integrity(
        history, ip_address, user_agent
    )
    
    if not is_valid:
        await integrity_service.mark_as_corrupted(
            history,
            reason="Hash mismatch detected during access",
            ip_address=ip_address
        )
    
    # Verificar acceso
    access_allowed, error_msg = await integrity_service.check_access_allowed(history, user)
    
    return (history, access_allowed, error_msg)
