import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

# Configuración desde variables de entorno
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# Context para hashing de contraseñas con Argon2
# Argon2 es el estándar moderno, más seguro que bcrypt y sin límite de longitud
pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
    argon2__memory_cost=65536,  # 64 MB de memoria
    argon2__time_cost=3,         # 3 iteraciones
    argon2__parallelism=4        # 4 threads paralelos
)


def hash_password(password: str) -> str:
    """
    Hash de contraseña usando Argon2id.
    Argon2 es el estándar actual (ganador de Password Hashing Competition 2015).
    No tiene límite de longitud y es más seguro que bcrypt.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica una contraseña contra su hash usando Argon2.
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow()
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def validate_password_strength(password: str) -> tuple[bool, list[str]]:
    errors = []
    
    if len(password) < 12:
        errors.append("Must be at least 12 characters")
    
    if not any(c.isupper() for c in password):
        errors.append("Must contain at least one uppercase letter")
    
    if not any(c.islower() for c in password):
        errors.append("Must contain at least one lowercase letter")
    
    if not any(c.isdigit() for c in password):
        errors.append("Must contain at least one number")
    
    special_chars = "!@#$%^&*()_+-=[]{}|;:'\",.<>?/"
    if not any(c in special_chars for c in password):
        errors.append("Must contain at least one special character")
    
    return len(errors) == 0, errors
