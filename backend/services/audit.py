"""
Servicio de Auditoría Centralizado - PBI-15
============================================
Implementa el "Audit Logger" central que:
- Recibe eventos desde los endpoints
- Los envía a un destino central (colección de auditoría separada)
- Garantiza que el flujo no pierda eventos (manejo de errores y reintentos)
- Soporta eventos WORM (Write Once Read Many)

Eventos estandarizados:
- HISTORIAL_ABIERTO: Usuario abrió un historial
- HISTORIAL_EDITADO: Usuario editó un historial
- CONSULTA_CREADA: Médico creó una consulta
- ACCESO_DENEGADO: Intento de acceso no autorizado
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum
import asyncio
import logging

from models.models import AuditLog

# Configurar logger
logger = logging.getLogger("sirona.audit")


class AuditEventType(str, Enum):
    """Tipos de eventos de auditoría estandarizados"""
    # Eventos de historial
    HISTORIAL_ABIERTO = "HISTORIAL_ABIERTO"
    HISTORIAL_EDITADO = "HISTORIAL_EDITADO"
    HISTORIAL_CORRUPTO = "HISTORIAL_CORRUPTO"
    
    # Eventos de consulta
    CONSULTA_CREADA = "CONSULTA_CREADA"
    CONSULTA_EDITADA = "CONSULTA_EDITADA"
    
    # Eventos de acceso
    ACCESO_DENEGADO = "ACCESO_DENEGADO"
    ACCESO_EXITOSO = "ACCESO_EXITOSO"
    
    # Eventos de autenticación
    LOGIN_EXITOSO = "LOGIN_EXITOSO"
    LOGIN_FALLIDO = "LOGIN_FALLIDO"
    CUENTA_BLOQUEADA = "CUENTA_BLOQUEADA"
    CUENTA_DESBLOQUEADA = "CUENTA_DESBLOQUEADA"
    
<<<<<<< HEAD
    # Eventos de usuario
    USUARIO_CREADO = "USUARIO_CREADO"
    USUARIO_EDITADO = "USUARIO_EDITADO"
=======
    # Eventos de usuario (CRUD)
    USUARIO_CREADO = "USUARIO_CREADO"
    USUARIO_EDITADO = "USUARIO_EDITADO"
    USUARIO_ELIMINADO = "USUARIO_ELIMINADO"
    USUARIO_CONSULTADO = "USUARIO_CONSULTADO"
>>>>>>> c0bfe8053f57a941960b020e285bb9ef323643eb
    ROL_CAMBIADO = "ROL_CAMBIADO"
    CONTRASENA_CAMBIADA = "CONTRASENA_CAMBIADA"
    
    # Eventos de integridad
    INTEGRIDAD_VERIFICADA = "INTEGRIDAD_VERIFICADA"
    INTEGRIDAD_FALLIDA = "INTEGRIDAD_FALLIDA"
    
    # Eventos de rate limiting
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
<<<<<<< HEAD
=======
    
    # Eventos de citas
    CITA_CREADA = "CITA_CREADA"
    CITA_EDITADA = "CITA_EDITADA"
    CITA_CANCELADA = "CITA_CANCELADA"
    
    # Eventos de disponibilidad
    DISPONIBILIDAD_CREADA = "DISPONIBILIDAD_CREADA"
    DISPONIBILIDAD_EDITADA = "DISPONIBILIDAD_EDITADA"
>>>>>>> c0bfe8053f57a941960b020e285bb9ef323643eb


class AuditLogger:
    """
    Logger de auditoría centralizado con reintentos y manejo de errores.
    
    Características:
    - Cola de eventos para procesamiento asíncrono
    - Reintentos automáticos en caso de fallo
    - Logging de respaldo si falla la BD
    """
    
    MAX_RETRIES = 3
    RETRY_DELAY = 1.0  # segundos
    
    def __init__(self):
        self._queue: List[AuditLog] = []
        self._processing = False
    
    async def log_event(
        self,
        event_type: AuditEventType,
        user_id: Optional[str] = None,
        user_email: Optional[str] = None,
        user_role: Optional[str] = None,
        patient_id: Optional[str] = None,
        ip_address: str = "unknown",
        user_agent: str = "",
        details: Optional[Dict[str, Any]] = None,
        action: Optional[str] = None
    ) -> Optional[AuditLog]:
        """
        Registra un evento de auditoría.
        
        Args:
            event_type: Tipo de evento (HISTORIAL_ABIERTO, HISTORIAL_EDITADO, etc.)
            user_id: ID del usuario que realiza la acción
            user_email: Email del usuario
            user_role: Rol del usuario (Médico, Paciente, etc.)
            patient_id: ID del paciente consultado/afectado
            ip_address: Dirección IP del cliente
            user_agent: User-Agent del navegador
            details: Información adicional del evento
            action: Acción específica realizada
        
        Returns:
            AuditLog creado o None si falla
        """
        # Construir detalles extendidos para cumplir con PBI-15
        extended_details = {
            "user_role": user_role,
            "patient_id": patient_id,
            "action": action or event_type.value,
            **(details or {})
        }
        
        audit_entry = AuditLog(
            timestamp=datetime.utcnow(),
            event=event_type.value,
            user_id=user_id,
            user_email=user_email,
            ip_address=ip_address,
            user_agent=user_agent,
            details=extended_details
        )
        
        # Intentar guardar con reintentos
        return await self._save_with_retry(audit_entry)
    
    async def _save_with_retry(self, audit_entry: AuditLog) -> Optional[AuditLog]:
        """Guarda el evento con reintentos automáticos."""
        for attempt in range(self.MAX_RETRIES):
            try:
                await audit_entry.insert()
                logger.info(
                    f"Audit event logged: {audit_entry.event} - "
                    f"User: {audit_entry.user_email} - "
                    f"IP: {audit_entry.ip_address}"
                )
                return audit_entry
            except Exception as e:
                logger.warning(
                    f"Failed to save audit event (attempt {attempt + 1}/{self.MAX_RETRIES}): {e}"
                )
                if attempt < self.MAX_RETRIES - 1:
                    await asyncio.sleep(self.RETRY_DELAY * (attempt + 1))
        
        # Si fallan todos los reintentos, log de respaldo
        logger.critical(
            f"AUDIT EVENT LOST - Failed to save after {self.MAX_RETRIES} attempts: "
            f"Event: {audit_entry.event}, User: {audit_entry.user_email}, "
            f"Details: {audit_entry.details}"
        )
        return None
    
    async def log_history_access(
        self,
        user_id: str,
        user_email: str,
        user_role: str,
        patient_id: str,
        ip_address: str,
        user_agent: str,
        action: str = "read",
        success: bool = True,
        details: Optional[Dict[str, Any]] = None
    ) -> Optional[AuditLog]:
        """
        Registra acceso a historial clínico (PBI-15).
        
        Contiene todos los campos requeridos:
        - ID_Usuario
        - Rol_Usuario  
        - ID_Paciente_Consultado
        - Acción_Realizada
        - Timestamp
        """
        event_type = AuditEventType.HISTORIAL_ABIERTO if action == "read" else AuditEventType.HISTORIAL_EDITADO
        
        if not success:
            event_type = AuditEventType.ACCESO_DENEGADO
        
        return await self.log_event(
            event_type=event_type,
            user_id=user_id,
            user_email=user_email,
            user_role=user_role,
            patient_id=patient_id,
            ip_address=ip_address,
            user_agent=user_agent,
            action=action,
            details={
                "success": success,
                **(details or {})
            }
        )
    
    async def log_integrity_check(
        self,
        patient_id: str,
        history_id: str,
        expected_hash: str,
        calculated_hash: str,
        is_valid: bool,
        ip_address: str = "system",
        user_agent: str = "integrity_checker"
    ) -> Optional[AuditLog]:
        """Registra verificación de integridad de historial (PBI-20)."""
        event_type = AuditEventType.INTEGRIDAD_VERIFICADA if is_valid else AuditEventType.INTEGRIDAD_FALLIDA
        
        return await self.log_event(
            event_type=event_type,
            patient_id=patient_id,
            ip_address=ip_address,
            user_agent=user_agent,
            details={
                "history_id": history_id,
                "expected_hash": expected_hash[:16] + "..." if expected_hash else None,
                "calculated_hash": calculated_hash[:16] + "..." if calculated_hash else None,
                "is_valid": is_valid
            }
        )


# Instancia global del logger de auditoría
audit_logger = AuditLogger()


# Funciones de conveniencia para uso directo
async def log_audit_event(
    event_type: AuditEventType,
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
    user_role: Optional[str] = None,
    patient_id: Optional[str] = None,
    ip_address: str = "unknown",
    user_agent: str = "",
    details: Optional[Dict[str, Any]] = None
) -> Optional[AuditLog]:
    """Función de conveniencia para registrar eventos."""
    return await audit_logger.log_event(
        event_type=event_type,
        user_id=user_id,
        user_email=user_email,
        user_role=user_role,
        patient_id=patient_id,
        ip_address=ip_address,
        user_agent=user_agent,
        details=details
    )


async def log_history_access(
    user_id: str,
    user_email: str,
    user_role: str,
    patient_id: str,
    ip_address: str,
    user_agent: str,
    action: str = "read",
    success: bool = True,
    details: Optional[Dict[str, Any]] = None
) -> Optional[AuditLog]:
    """Función de conveniencia para registrar acceso a historiales."""
    return await audit_logger.log_history_access(
        user_id=user_id,
        user_email=user_email,
        user_role=user_role,
        patient_id=patient_id,
        ip_address=ip_address,
        user_agent=user_agent,
        action=action,
        success=success,
        details=details
    )
