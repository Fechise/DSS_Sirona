"""
=============================================================================
SERVICIO DE AUTENTICACIÓN MULTIFACTOR (MFA) - SIRONA
=============================================================================
Módulo: services/mfa.py
Responsabilidad: Gestión de TOTP (Time-based One-Time Password)

Common Criteria References:
- FIA_UAU.2: Autenticación de Usuario Antes de Cualquier Acción
- FIA_SOS.2: Generación de Secretos TSF
- FCS_COP.1: Operación Criptográfica (HMAC-SHA1)

Estándares:
- RFC 6238: TOTP (Time-Based One-Time Password Algorithm)
- RFC 4226: HOTP (HMAC-Based One-Time Password Algorithm)

Flujo de MFA:
1. Usuario hace login con email/password
2. Si mfa_secret es None → Generar secreto y mostrar QR
3. Usuario escanea QR con app (Google Authenticator, Authy, etc.)
4. Usuario ingresa código OTP para verificar setup
5. Guardar mfa_secret encriptado en usuario
6. En logins futuros → Pedir OTP después de password válido
=============================================================================
"""

import pyotp
import qrcode
import io
import base64
from typing import Optional, Tuple
from datetime import datetime


class MFAService:
    """
    Servicio para gestión de autenticación TOTP.
    
    SEGURIDAD (FIA_SOS.2):
    - Secretos de 32 caracteres base32 (160 bits de entropía)
    - Códigos de 6 dígitos válidos por 30 segundos
    - Ventana de validación de ±1 período para sincronización
    """
    
    # Nombre de la aplicación que aparece en el autenticador
    ISSUER_NAME = "Sirona Medical System"
    
    # Dígitos del código OTP
    OTP_DIGITS = 6
    
    # Intervalo de tiempo en segundos (estándar TOTP)
    OTP_INTERVAL = 30
    
    @staticmethod
    def generate_secret() -> str:
        """
        Genera un secreto TOTP aleatorio.
        
        SEGURIDAD (FIA_SOS.2):
        - 32 caracteres base32 = 160 bits de entropía
        - Generación criptográficamente segura (os.urandom)
        
        Returns:
            str: Secreto en formato base32
        """
        return pyotp.random_base32()
    
    @staticmethod
    def get_totp_uri(secret: str, email: str) -> str:
        """
        Genera la URI otpauth:// para el código QR.
        
        Formato: otpauth://totp/{issuer}:{email}?secret={secret}&issuer={issuer}
        
        Args:
            secret: Secreto TOTP en base32
            email: Email del usuario (identificador)
            
        Returns:
            str: URI otpauth:// completa
        """
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(
            name=email,
            issuer_name=MFAService.ISSUER_NAME
        )
    
    @staticmethod
    def generate_qr_code(secret: str, email: str) -> str:
        """
        Genera código QR como imagen base64 para mostrar en frontend.
        
        El QR contiene la URI otpauth:// que las apps de autenticación
        pueden escanear para agregar la cuenta.
        
        Args:
            secret: Secreto TOTP en base32
            email: Email del usuario
            
        Returns:
            str: Imagen PNG del QR en base64 (data:image/png;base64,...)
        """
        # Obtener URI otpauth://
        uri = MFAService.get_totp_uri(secret, email)
        
        # Generar QR
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(uri)
        qr.make(fit=True)
        
        # Crear imagen
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convertir a base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        img_base64 = base64.b64encode(buffer.read()).decode('utf-8')
        
        return f"data:image/png;base64,{img_base64}"
    
    @staticmethod
    def verify_otp(secret: str, otp_code: str, valid_window: int = 1) -> bool:
        """
        Verifica un código OTP contra el secreto.
        
        SEGURIDAD (FIA_UAU.2):
        - Validación con ventana de ±1 período (30 segundos antes/después)
        - Permite pequeñas desincronizaciones de reloj
        
        Args:
            secret: Secreto TOTP del usuario
            otp_code: Código de 6 dígitos ingresado
            valid_window: Períodos de tolerancia (default: 1)
            
        Returns:
            bool: True si el código es válido
        """
        if not secret or not otp_code:
            return False
        
        try:
            totp = pyotp.TOTP(secret)
            return totp.verify(otp_code, valid_window=valid_window)
        except Exception:
            return False
    
    @staticmethod
    def get_current_otp(secret: str) -> str:
        """
        Obtiene el código OTP actual (útil para testing).
        
        Args:
            secret: Secreto TOTP
            
        Returns:
            str: Código OTP actual de 6 dígitos
        """
        totp = pyotp.TOTP(secret)
        return totp.now()
    
    @staticmethod
    def get_time_remaining() -> int:
        """
        Obtiene segundos restantes hasta el próximo código.
        
        Returns:
            int: Segundos restantes (0-30)
        """
        import time
        return MFAService.OTP_INTERVAL - (int(time.time()) % MFAService.OTP_INTERVAL)


# Instancia global del servicio
mfa_service = MFAService()
