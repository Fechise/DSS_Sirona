from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from models.models import User, UserRole
from services.security import decode_token

# Esquema de seguridad Bearer para Swagger/OpenAPI
# Esto hace que aparezca el candado en la documentación
security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """
    Extrae y valida el token JWT del header Authorization.
    Retorna el usuario autenticado.
    
    Raises:
        HTTPException 401: Si el token es inválido o el usuario no existe
    """
    token = credentials.credentials
    
    # Decodificar token
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Extraer user_id del token
    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Buscar usuario en DB
    user = await User.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def require_role(user: User, allowed_roles: list[UserRole]):
    """
    Verifica que el usuario tenga uno de los roles permitidos.
    
    Raises:
        HTTPException 403: Si el usuario no tiene el rol requerido
    """
    if user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Required roles: {[r.value for r in allowed_roles]}"
        )


async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Retorna el usuario solo si es Administrador.
    """
    await require_role(current_user, [UserRole.ADMINISTRADOR])
    return current_user


async def get_secretary_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Retorna el usuario solo si es Secretario.
    """
    await require_role(current_user, [UserRole.SECRETARIO])
    return current_user


async def get_doctor_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Retorna el usuario solo si es Médico.
    """
    await require_role(current_user, [UserRole.MEDICO])
    return current_user
