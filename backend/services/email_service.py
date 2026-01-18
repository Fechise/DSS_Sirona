"""
Servicio de envío de emails para notificaciones del sistema.
Incluye envío de contraseñas temporales a nuevos usuarios.
"""
import os
import smtplib
import secrets
import string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

# ==================== CONFIGURACIÓN SMTP ====================
SMTP_HOST = os.getenv('SMTP_HOST')
SMTP_PORT = int(os.getenv('SMTP_PORT'))
SMTP_USER = os.getenv('SMTP_USER')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')
SMTP_FROM_EMAIL = os.getenv('SMTP_FROM_EMAIL')
SMTP_FROM_NAME = os.getenv('SMTP_FROM_NAME')


class EmailServiceError(Exception):
    """Excepción personalizada para errores del servicio de email"""
    pass


def is_email_configured() -> bool:
    """Verifica si el servicio de email está configurado correctamente"""
    return bool(SMTP_HOST and SMTP_USER and SMTP_PASSWORD)


def generate_temporary_password(length: int = 16) -> str:
    """
    Genera una contraseña temporal segura que cumple con los requisitos:
    - Mínimo 12 caracteres (por defecto 16)
    - Al menos 1 mayúscula
    - Al menos 1 minúscula
    - Al menos 1 número
    - Al menos 1 símbolo especial
    
    Args:
        length: Longitud de la contraseña (mínimo 12)
    
    Returns:
        str: Contraseña temporal generada
    """
    if length < 12:
        length = 12
    
    # Definir conjuntos de caracteres
    uppercase = string.ascii_uppercase
    lowercase = string.ascii_lowercase
    digits = string.digits
    symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?"
    
    # Asegurar al menos un carácter de cada tipo
    password = [
        secrets.choice(uppercase),
        secrets.choice(lowercase),
        secrets.choice(digits),
        secrets.choice(symbols)
    ]
    
    # Completar el resto con caracteres aleatorios
    all_chars = uppercase + lowercase + digits + symbols
    password += [secrets.choice(all_chars) for _ in range(length - 4)]
    
    # Mezclar para evitar patrones predecibles
    secrets.SystemRandom().shuffle(password)
    
    return ''.join(password)


async def send_email(
    to_email: str,
    subject: str,
    body_html: str,
    body_text: Optional[str] = None
) -> bool:
    """
    Envía un email usando el servidor SMTP configurado.
    
    Args:
        to_email: Dirección de email del destinatario
        subject: Asunto del email
        body_html: Contenido HTML del email
        body_text: Contenido de texto plano (opcional, fallback)
    
    Returns:
        bool: True si el email se envió correctamente
    
    Raises:
        EmailServiceError: Si hay un error al enviar el email
    """
    if not is_email_configured():
        raise EmailServiceError(
            "Email service is not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD in .env"
        )
    
    try:
        # Crear mensaje
        msg = MIMEMultipart('alternative')
        msg['From'] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Agregar contenido de texto plano si se proporciona
        if body_text:
            part1 = MIMEText(body_text, 'plain', 'utf-8')
            msg.attach(part1)
        
        # Agregar contenido HTML
        part2 = MIMEText(body_html, 'html', 'utf-8')
        msg.attach(part2)
        
        # Conectar y enviar
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
        return True
    
    except Exception as e:
        raise EmailServiceError(f"Failed to send email: {str(e)}")


async def send_temporary_password_email(
    to_email: str,
    full_name: str,
    temporary_password: str,
    role: str
) -> bool:
    """
    Envía un email con la contraseña temporal a un nuevo usuario.
    
    Args:
        to_email: Email del nuevo usuario
        full_name: Nombre completo del usuario
        temporary_password: Contraseña temporal generada
        role: Rol del usuario (Médico, Paciente, Secretario, etc.)
    
    Returns:
        bool: True si el email se envió correctamente
    """
    subject = "Bienvenido a Sirona - Sus credenciales de acceso"
    
    body_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9f9f9;
            }}
            .header {{
                background-color: #2a9d8f;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
            }}
            .content {{
                background-color: white;
                padding: 30px;
                border-radius: 0 0 8px 8px;
            }}
            .credentials {{
                background-color: #f0f0f0;
                padding: 15px;
                border-left: 4px solid #2a9d8f;
                margin: 20px 0;
            }}
            .password {{
                font-family: 'Courier New', monospace;
                font-size: 16px;
                font-weight: bold;
                color: #d32f2f;
                word-break: break-all;
            }}
            .warning {{
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin: 20px 0;
            }}
            .footer {{
                text-align: center;
                margin-top: 20px;
                color: #666;
                font-size: 12px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏥 Bienvenido a Sirona</h1>
            </div>
            <div class="content">
                <p>Estimado/a <strong>{full_name}</strong>,</p>
                
                <p>Su cuenta ha sido creada exitosamente en el sistema Sirona con el rol de <strong>{role}</strong>.</p>
                
                <div class="credentials">
                    <p><strong>📧 Usuario (Email):</strong><br>{to_email}</p>
                    <p><strong>🔐 Contraseña Temporal:</strong><br>
                    <span class="password">{temporary_password}</span></p>
                </div>
                
                <div class="warning">
                    <p><strong>⚠️ IMPORTANTE - SEGURIDAD:</strong></p>
                    <ul>
                        <li>Esta es una contraseña temporal. Se recomienda cambiarla inmediatamente después del primer inicio de sesión.</li>
                        <li>No comparta esta contraseña con nadie.</li>
                        <li>Acceda a su perfil y seleccione "Cambiar Contraseña" para establecer una contraseña personal.</li>
                        <li>Este correo contiene información confidencial. Elimínelo después de cambiar su contraseña.</li>
                    </ul>
                </div>
                
                <p>Para acceder al sistema, visite: <a href="http://localhost:5173/login">Sistema Sirona</a></p>
                
                <p>Si tiene alguna pregunta o problema para acceder, por favor contacte al administrador del sistema.</p>
                
                <p>Saludos cordiales,<br>
                <strong>Equipo Sirona</strong></p>
            </div>
            <div class="footer">
                <p>Este es un mensaje automático. Por favor no responda a este correo.</p>
                <p>&copy; 2026 Sistema Sirona - Gestión de Historiales Médicos</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    body_text = f"""
    Bienvenido a Sirona
    
    Estimado/a {full_name},
    
    Su cuenta ha sido creada exitosamente en el sistema Sirona con el rol de {role}.
    
    CREDENCIALES DE ACCESO:
    Usuario (Email): {to_email}
    Contraseña Temporal: {temporary_password}
    
    IMPORTANTE - SEGURIDAD:
    - Esta es una contraseña temporal. Cámbiela inmediatamente después del primer inicio de sesión.
    - No comparta esta contraseña con nadie.
    - Este correo contiene información confidencial. Elimínelo después de cambiar su contraseña.
    
    Para acceder al sistema, visite: http://localhost:5173/login
    
    Si tiene alguna pregunta, contacte al administrador del sistema.
    
    Saludos cordiales,
    Equipo Sirona
    
    ---
    Este es un mensaje automático. Por favor no responda a este correo.
    """
    
    return await send_email(to_email, subject, body_html, body_text)
