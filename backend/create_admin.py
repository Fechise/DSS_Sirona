"""
Script para crear un usuario administrador en la base de datos Sirona

Uso:
    python create_admin.py

El script solicitará los datos necesarios y creará un usuario con rol de Administrador.
"""

import asyncio
import os
from datetime import datetime
from getpass import getpass
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

# Importar modelos y servicios
from models.models import User, UserRole, UserStatus, SecuritySettings
from services.security import hash_password


async def create_admin_user():
    """
    Crea un usuario administrador en la base de datos
    """
    print("=" * 60)
    print("CREACIÓN DE USUARIO ADMINISTRADOR - SIRONA")
    print("=" * 60)
    print()
    
    # Solicitar datos del usuario
    print("Ingrese los datos del administrador:")
    print("-" * 60)
    
    fullName = input("Nombre completo: ").strip()
    if not fullName:
        print("❌ El nombre completo es obligatorio")
        return
    
    email = input("Email: ").strip().lower()
    if not email or "@" not in email:
        print("❌ El email no es válido")
        return
    
    cedula = input("Cédula: ").strip()
    if not cedula:
        print("❌ La cédula es obligatoria")
        return
    
    # Solicitar contraseña de forma segura
    while True:
        password = getpass("Contraseña (mínimo 8 caracteres): ")
        if len(password) < 8:
            print("❌ La contraseña debe tener al menos 8 caracteres")
            continue
        
        password_confirm = getpass("Confirme contraseña: ")
        if password != password_confirm:
            print("❌ Las contraseñas no coinciden")
            continue
        
        break
    
    print()
    print("-" * 60)
    print("Conectando a la base de datos...")
    
    # Configuración de base de datos desde variables de entorno
    MONGO_URI_AUTH = os.getenv("MONGO_URI_AUTH", "mongodb://localhost:27017")
    DB_NAME_AUTH = os.getenv("DB_NAME_AUTH", "sirona_auth")
    
    # Conectar a MongoDB
    try:
        client = AsyncIOMotorClient(MONGO_URI_AUTH)
        db = client[DB_NAME_AUTH]
        
        # Inicializar Beanie
        await init_beanie(database=db, document_models=[User])
        
        print("✓ Conexión exitosa a la base de datos")
        
        # Verificar si el usuario ya existe
        existing_user = await User.find_one({"email": email})
        if existing_user:
            print(f"❌ Ya existe un usuario con el email: {email}")
            return
        
        existing_cedula = await User.find_one({"cedula": cedula})
        if existing_cedula:
            print(f"❌ Ya existe un usuario con la cédula: {cedula}")
            return
        
        # Hash de la contraseña (ahora soporta cualquier longitud)
        password_hash = hash_password(password)
        
        # Crear el usuario administrador con MFA obligatorio
        admin_user = User(
            email=email,
            password_hash=password_hash,
            fullName=fullName,
            cedula=cedula,
            role=UserRole.ADMINISTRADOR,
            status=UserStatus.ACTIVO,
            permissions=[
                "users:read",
                "users:write",
                "users:delete",
                "patients:read",
                "patients:write",
                "appointments:read",
                "appointments:write",
                "reports:read",
                "settings:write",
                "audit:read"
            ],
            security=SecuritySettings(mfa_enabled=True),  # MFA obligatorio
            created_at=datetime.utcnow(),
            member_since=datetime.utcnow().strftime("%Y-%m-%d")
        )
        
        # Guardar en la base de datos
        await admin_user.insert()
        
        print()
        print("=" * 60)
        print("✅ USUARIO ADMINISTRADOR CREADO EXITOSAMENTE")
        print("=" * 60)
        print(f"Nombre: {admin_user.fullName}")
        print(f"Email: {admin_user.email}")
        print(f"Cédula: {admin_user.cedula}")
        print(f"Rol: {admin_user.role.value}")
        print(f"Estado: {admin_user.status.value}")
        print(f"ID: {admin_user.id}")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Error al crear el usuario: {str(e)}")
        raise
    finally:
        if 'client' in locals():
            client.close()


def main():
    """
    Función principal
    """
    try:
        asyncio.run(create_admin_user())
    except KeyboardInterrupt:
        print("\n\n⚠️  Operación cancelada por el usuario")
    except Exception as e:
        print(f"\n❌ Error inesperado: {str(e)}")


if __name__ == "__main__":
    main()
