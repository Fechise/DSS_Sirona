import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from contextlib import asynccontextmanager
from typing import Optional

from models.models import (
    User,
    Session,
    MFASecret,
    PatientHistory,
    ClinicalRecord,
    Appointment,
    DoctorAvailability,
    AuditLog
)

# === ARQUITECTURA DE 3 BASES DE DATOS (ZERO TRUST) ===

# 1. Base de Datos de IDENTIDAD (Credenciales, Autenticación)
mongo_client_auth: Optional[AsyncIOMotorClient] = None
db_auth = None  # sirona_auth

# 2. Base de Datos de NEGOCIO (Datos Clínicos)
mongo_client_core: Optional[AsyncIOMotorClient] = None
db_core = None  # sirona_core

# 3. Base de Datos de AUDITORÍA (Logs, Solo Escritura)
mongo_client_logs: Optional[AsyncIOMotorClient] = None
db_logs = None  # sirona_logs (Append-Only)

# Configuración desde variables de entorno
MONGO_URI_AUTH = os.getenv("MONGO_URI_AUTH", "mongodb://localhost:27017")
MONGO_URI_CORE = os.getenv("MONGO_URI_CORE", "mongodb://localhost:27017")
MONGO_URI_LOGS = os.getenv("MONGO_URI_LOGS", "mongodb://localhost:27017")

DB_NAME_AUTH = os.getenv("DB_NAME_AUTH", "sirona_auth")
DB_NAME_CORE = os.getenv("DB_NAME_CORE", "sirona_core")
DB_NAME_LOGS = os.getenv("DB_NAME_LOGS", "sirona_logs")


async def init_db():
    """
    Inicializa las 3 bases de datos separadas para arquitectura Zero Trust:
    
    1. sirona_auth - Identidad y credenciales
    2. sirona_core - Datos de negocio (clínicos)
    3. sirona_logs - Auditoría (append-only)
    """
    global mongo_client_auth, db_auth
    global mongo_client_core, db_core
    global mongo_client_logs, db_logs
    
    try:
        # ===== 1. BASE DE IDENTIDAD (sirona_auth) =====
        mongo_client_auth = AsyncIOMotorClient(MONGO_URI_AUTH)
        db_auth = mongo_client_auth[DB_NAME_AUTH]
        
        await init_beanie(
            database=db_auth,
            document_models=[
                User,        # Credenciales, roles
                Session,     # Tokens activos
                MFASecret    # Secretos de 2FA
            ]
        )
        
        print(f"DB Identidad: {DB_NAME_AUTH}")
        
        # ===== 2. BASE DE NEGOCIO (sirona_core) =====
        mongo_client_core = AsyncIOMotorClient(MONGO_URI_CORE)
        db_core = mongo_client_core[DB_NAME_CORE]
        
        await init_beanie(
            database=db_core,
            document_models=[
                PatientHistory,      # Historiales de pacientes
                ClinicalRecord,      # Registros médicos
                Appointment,         # Citas médicas
                DoctorAvailability   # Disponibilidad de médicos
            ]
        )
        
        print(f"DB Negocio: {DB_NAME_CORE}")
        
        # ===== 3. BASE DE AUDITORÍA (sirona_logs) =====
        mongo_client_logs = AsyncIOMotorClient(MONGO_URI_LOGS)
        db_logs = mongo_client_logs[DB_NAME_LOGS]
        
        await init_beanie(
            database=db_logs,
            document_models=[
                AuditLog  # Solo escritura (append-only)
            ]
        )
        
        # Configurar permisos de solo escritura en producción
        # db_logs.command({"createRole": "appendOnlyRole", "privileges": [...]})
        
        print(f"DB Auditoría: {DB_NAME_LOGS} (Append-Only)")
        
    except Exception as e:
        print(f"Error al conectar con MongoDB: {e}")
        raise


async def close_db():
    """
    Cierra las 3 conexiones a MongoDB.
    """
    global mongo_client_auth, mongo_client_core, mongo_client_logs
    
    if mongo_client_auth:
        mongo_client_auth.close()
    if mongo_client_core:
        mongo_client_core.close()
    if mongo_client_logs:
        mongo_client_logs.close()
    
    print("🔌 Conexiones a MongoDB cerradas")


@asynccontextmanager
async def lifespan_db():
    """
    Context manager para usar en FastAPI lifespan.
    """
    await init_db()
    yield
    await close_db()


def get_auth_db():
    """Retorna la base de datos de IDENTIDAD (credenciales, sesiones)"""
    if db_auth is None:
        raise RuntimeError("Auth DB not initialized. Call init_db() first.")
    return db_auth


def get_core_db():
    """Retorna la base de datos de NEGOCIO (datos clínicos)"""
    if db_core is None:
        raise RuntimeError("Core DB not initialized. Call init_db() first.")
    return db_core


def get_logs_db():
    """Retorna la base de datos de AUDITORÍA (solo escritura)"""
    if db_logs is None:
        raise RuntimeError("Logs DB not initialized. Call init_db() first.")
    return db_logs
