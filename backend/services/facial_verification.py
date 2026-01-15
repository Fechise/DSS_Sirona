"""
Servicio de verificación facial usando Kairos IDV API.

Este servicio implementa:
- Full ID Verification: Registro facial con documento de identidad
- Liveness Verification: Prueba de vida para evitar spoofing
- Biometric Verification: Comparación facial para login

Cumple con PBI-6 (registro con verificación facial) y PBI-8 (login facial con liveness detection).
"""
import os
import io
import base64
import requests
import asyncio
from typing import Optional, Tuple
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

# ==================== CONFIGURACIÓN KAIROS ====================
KAIROS_BASE_URL = os.getenv('KAIROS_IDV_BASE_URL', 'https://idv-eu.kairos.com/v0.1')
KAIROS_APP_ID = os.getenv('KAIROS_IDV_APP_ID')
KAIROS_APP_KEY = os.getenv('KAIROS_IDV_APP_KEY')
KAIROS_PROFILE = os.getenv('KAIROS_PROFILE', 'optimal-v0')  # permissive-v0, optimal-v0, strict-v0


class KairosServiceError(Exception):
    """Excepción personalizada para errores del servicio Kairos"""
    def __init__(self, message: str, status_code: int = 500, details: dict = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


def is_kairos_configured() -> bool:
    """Verifica si Kairos está configurado correctamente"""
    return bool(KAIROS_BASE_URL and KAIROS_APP_ID and KAIROS_APP_KEY)


def validate_and_resize_image(image_bytes: bytes, min_size: int = 300) -> bytes:
    """
    Valida y redimensiona una imagen si es necesaria.
    Kairos requiere imágenes de al menos 300x300 píxeles.
    
    Args:
        image_bytes: Bytes de la imagen original
        min_size: Tamaño mínimo requerido (300px para Kairos)
    
    Returns:
        Bytes de la imagen procesada (JPEG)
    
    Raises:
        KairosServiceError: Si hay error procesando la imagen
    """
    try:
        # Abrir imagen desde bytes
        image = Image.open(io.BytesIO(image_bytes))
        
        # Verificar dimensiones
        width, height = image.size
        print(f"[KAIROS IMAGE] Dimensiones originales: {width}x{height}")
        
        # Si la imagen es muy pequeña, redimensionar manteniendo aspect ratio
        if width < min_size or height < min_size:
            # Calcular nuevo tamaño manteniendo proporción
            if width < height:
                new_width = min_size
                new_height = int(height * (min_size / width))
            else:
                new_height = min_size
                new_width = int(width * (min_size / height))
            
            image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
            print(f"[KAIROS IMAGE] Redimensionada a: {new_width}x{new_height}")
        
        # Convertir a RGB si es necesario (para PNGs con transparencia)
        if image.mode in ('RGBA', 'LA', 'P'):
            # Crear fondo blanco para transparencia
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if len(image.split()) > 3 else None)
            image = background
        elif image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convertir de vuelta a bytes
        output = io.BytesIO()
        image.save(output, format='JPEG', quality=95)
        output.seek(0)
        
        result_bytes = output.read()
        print(f"[KAIROS IMAGE] Tamaño final: {len(result_bytes)} bytes")
        return result_bytes
        
    except Exception as e:
        print(f"[KAIROS IMAGE ERROR] Error procesando imagen: {str(e)}")
        raise KairosServiceError(f"Error procesando imagen: {str(e)}", status_code=400)


def kairos_full_id_verification(
    selfie_content: bytes, 
    document_content: bytes, 
    document_back_content: bytes = None
) -> dict:
    """
    Kairos Full ID Verification: Verifica selfie + documento de identidad.
    
    Proceso:
    1. Valida que selfie y documento son del mismo individuo
    2. Verifica autenticidad del documento
    3. Verifica liveness del selfie
    
    Args:
        selfie_content: Bytes de la imagen selfie
        document_content: Bytes del frente del documento
        document_back_content: Bytes del reverso del documento (opcional)
    
    Returns:
        dict con api_req_uuid para consultar resultados
    
    Raises:
        KairosServiceError: Si hay error en la verificación
    """
    if not is_kairos_configured():
        raise KairosServiceError(
            "Configuración de Kairos incompleta. Verificar variables de entorno.",
            status_code=500
        )
    
    # Validar y redimensionar imágenes
    print("[KAIROS] Validando y redimensionando imágenes...")
    selfie_content = validate_and_resize_image(selfie_content)
    document_content = validate_and_resize_image(document_content)
    if document_back_content:
        document_back_content = validate_and_resize_image(document_back_content)
    
    url = f"{KAIROS_BASE_URL}/full-id-verification"
    headers = {
        'app_id': KAIROS_APP_ID,
        'app_key': KAIROS_APP_KEY
    }
    
    # En multipart/form-data, los campos de texto se envían como (None, valor)
    files = {
        'selfie': ('selfie.jpg', io.BytesIO(selfie_content), 'image/jpeg'),
        'document': ('document.jpg', io.BytesIO(document_content), 'image/jpeg'),
        'profile': (None, KAIROS_PROFILE)
    }
    
    if document_back_content:
        files['document_back'] = ('document_back.jpg', io.BytesIO(document_back_content), 'image/jpeg')
    
    try:
        print(f"[KAIROS] Enviando Full ID Verification a {url}")
        response = requests.post(url, headers=headers, files=files, timeout=300)
        response.raise_for_status()
        result = response.json()
        print(f"[KAIROS] Respuesta Full ID: {result}")
        return result
    except requests.HTTPError as e:
        error_detail = f"Error {response.status_code} en Kairos: {str(e)}"
        try:
            error_body = response.json()
            error_detail = f"Error {response.status_code}: {error_body}"
        except:
            pass
        print(f"[KAIROS ERROR] {error_detail}")
        raise KairosServiceError(error_detail, status_code=response.status_code)
    except requests.RequestException as e:
        raise KairosServiceError(f"Error en Kairos Full ID Verification: {str(e)}")


def kairos_get_verification_results(api_req_uuid: str) -> dict:
    """
    Obtiene resultados de verificación por UUID.
    
    Args:
        api_req_uuid: UUID de la solicitud de verificación
    
    Returns:
        dict con resultados de la verificación
    
    Raises:
        KairosServiceError: Si hay error obteniendo resultados
    """
    if not is_kairos_configured():
        raise KairosServiceError("Configuración de Kairos incompleta")
    
    url = f"{KAIROS_BASE_URL}/full-id-verification/{api_req_uuid}"
    headers = {
        'app_id': KAIROS_APP_ID,
        'app_key': KAIROS_APP_KEY
    }
    
    print(f"[KAIROS GET] Consultando UUID: {api_req_uuid}")
    
    try:
        response = requests.get(url, headers=headers, timeout=300)
        print(f"[KAIROS GET] Status Code: {response.status_code}")
        
        if response.status_code == 404:
            # 404 puede significar que aún está procesando
            return {
                "response_code": 2,
                "message": "Verificación aún en procesamiento",
                "status": "processing"
            }
        
        response.raise_for_status()
        return response.json()
    except requests.HTTPError as e:
        print(f"[KAIROS GET ERROR] HTTP {response.status_code}: {str(e)}")
        raise KairosServiceError(
            f"Error HTTP {response.status_code}: {str(e)}", 
            status_code=response.status_code
        )
    except requests.RequestException as e:
        print(f"[KAIROS GET ERROR] Request Exception: {str(e)}")
        raise KairosServiceError(f"Error obteniendo resultados Kairos: {str(e)}")


def kairos_liveness_verification(selfie_content: bytes, threshold: float = 0.6) -> dict:
    """
    Kairos Liveness Verification: Verifica que selfie es de persona viva.
    
    Detecta intentos de spoofing como:
    - Fotos de fotos
    - Pantallas/monitores
    - Máscaras
    
    Args:
        selfie_content: Bytes de la imagen selfie
        threshold: Umbral de confianza (0.0-1.0, default 0.6)
    
    Returns:
        dict con score de liveness
    
    Raises:
        KairosServiceError: Si hay error en la verificación
    """
    if not is_kairos_configured():
        raise KairosServiceError("Configuración de Kairos incompleta")
    
    # Validar imagen
    selfie_content = validate_and_resize_image(selfie_content)
    
    url = f"{KAIROS_BASE_URL}/liveness-verification"
    headers = {
        'app_id': KAIROS_APP_ID,
        'app_key': KAIROS_APP_KEY
    }
    
    files = {
        'selfie': ('selfie.jpg', io.BytesIO(selfie_content), 'image/jpeg')
    }
    
    data = {
        'threshold': str(threshold)
    }
    
    try:
        print(f"[KAIROS] Verificando liveness con threshold={threshold}")
        response = requests.post(url, headers=headers, files=files, data=data, timeout=300)
        response.raise_for_status()
        result = response.json()
        print(f"[KAIROS] Respuesta Liveness: {result}")
        return result
    except requests.RequestException as e:
        raise KairosServiceError(f"Error en Kairos Liveness: {str(e)}")


def kairos_biometric_verification(selfie_content: bytes, image_content: bytes) -> dict:
    """
    Kairos Biometric Verification: Compara selfie vs imagen almacenada.
    
    Args:
        selfie_content: Bytes del selfie actual
        image_content: Bytes de la imagen de referencia (documento)
    
    Returns:
        dict con resultado de comparación biométrica
    
    Raises:
        KairosServiceError: Si hay error en la verificación
    """
    if not is_kairos_configured():
        raise KairosServiceError("Configuración de Kairos incompleta")
    
    # Validar imágenes
    selfie_content = validate_and_resize_image(selfie_content)
    image_content = validate_and_resize_image(image_content)
    
    url = f"{KAIROS_BASE_URL}/biometric-verification"
    headers = {
        'app_id': KAIROS_APP_ID,
        'app_key': KAIROS_APP_KEY
    }
    
    files = {
        'selfie': ('selfie.jpg', io.BytesIO(selfie_content), 'image/jpeg'),
        'image': ('image.jpg', io.BytesIO(image_content), 'image/jpeg')
    }
    
    try:
        print("[KAIROS] Verificando biométrica...")
        response = requests.post(url, headers=headers, files=files, timeout=300)
        response.raise_for_status()
        result = response.json()
        print(f"[KAIROS] Respuesta Biometric: {result}")
        return result
    except requests.RequestException as e:
        raise KairosServiceError(f"Error en Kairos Biometric: {str(e)}")


def evaluate_kairos_decision(decision_data: dict, biometric_data: dict = None) -> Tuple[bool, str]:
    """
    Evalúa la decisión de Kairos.
    
    Args:
        decision_data: Datos de decisión de Kairos
        biometric_data: Datos biométricos opcionales
    
    Returns:
        Tuple (es_valido, mensaje)
    """
    reject_score = decision_data.get('reject_score', 0)
    review_score = decision_data.get('review_score', 0)
    warning_score = decision_data.get('warning_score', 0)
    details = decision_data.get('details', [])
    
    print(f"[KAIROS EVAL] reject={reject_score}, review={review_score}, warning={warning_score}")
    
    # Si hay rechazo, no aprobar
    if reject_score > 0:
        reject_reasons = [d.get('description', 'Rechazado') for d in details if d.get('decision') == 'reject']
        message = "; ".join(reject_reasons) if reject_reasons else "Verificación rechazada"
        return False, message
    
    # Si hay revisión necesaria, verificar liveness score
    if review_score > 0:
        if biometric_data:
            liveness_score = biometric_data.get('selfie_liveness_score', 0)
            if liveness_score >= 0.6:
                print(f"[KAIROS EVAL] Liveness score {liveness_score} >= 0.6, aprobando")
                return True, "Verificación exitosa (liveness aceptable)"
        
        review_reasons = [d.get('description', 'Revisión requerida') for d in details if d.get('decision') == 'review']
        message = "; ".join(review_reasons) if review_reasons else "Revisión manual requerida"
        return False, message
    
    # Sin problemas detectados
    print("[KAIROS EVAL] Sin problemas detectados, aprobando")
    return True, "Verificación exitosa"


async def wait_for_kairos_processing(
    api_req_uuid: str, 
    max_attempts: int = 60, 
    delay: int = 5
) -> dict:
    """
    Espera a que Kairos procese la solicitud.
    
    Args:
        api_req_uuid: UUID de la solicitud
        max_attempts: Máximo número de intentos (default 60)
        delay: Segundos entre intentos (default 5)
    
    Returns:
        dict con resultados de la verificación
    
    Raises:
        KairosServiceError: Si hay timeout o error
    """
    for attempt in range(max_attempts):
        try:
            result = kairos_get_verification_results(api_req_uuid)
            
            response_code = result.get('response_code')
            response_data = result.get('response_data', {})
            decision = response_data.get('decision', {})
            
            # Verificar si hay datos de decisión disponibles
            has_decision_data = bool(decision and (decision.get('details') is not None))
            
            # response_code: 0 = exitoso, 1 = completado, 2 = procesando
            if response_code == 2 and not has_decision_data:
                print(f"[KAIROS WAIT] Intento {attempt + 1}/{max_attempts} - Procesando...")
                await asyncio.sleep(delay)
                continue
            
            # Procesamiento completado
            print(f"[KAIROS WAIT] Procesamiento completado en intento {attempt + 1}")
            return result
            
        except KairosServiceError as e:
            if e.status_code == 404:
                # 404 puede significar que aún está procesando
                print(f"[KAIROS WAIT] Intento {attempt + 1}/{max_attempts} - 404 (procesando)")
                await asyncio.sleep(delay)
                continue
            raise
        except Exception as e:
            print(f"[KAIROS WAIT ERROR] Error inesperado: {str(e)}")
            await asyncio.sleep(delay)
        
        if attempt < max_attempts - 1:
            await asyncio.sleep(delay)
    
    raise KairosServiceError(
        f"Timeout esperando procesamiento de Kairos después de {max_attempts * delay} segundos",
        status_code=408,
        details={"api_req_uuid": api_req_uuid}
    )


def encode_image_to_base64(image_bytes: bytes) -> str:
    """Codifica imagen a base64 para almacenamiento"""
    return base64.b64encode(image_bytes).decode('utf-8')


def decode_image_from_base64(base64_string: str) -> bytes:
    """Decodifica imagen desde base64"""
    return base64.b64decode(base64_string)
