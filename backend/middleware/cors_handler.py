"""
Middleware personalizado para manejar CORS sin conflictos con el hosting.
Evita headers duplicados que causan errores 'Access-Control-Allow-Origin' múltiples.
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
import os


class CustomCORSMiddleware(BaseHTTPMiddleware):
    """
    Middleware que añade headers CORS manualmente y limpia duplicados.
    Usado cuando el hosting añade headers CORS automáticos que entran en conflicto.
    """
    
    def __init__(self, app, allowed_origins: list[str]):
        super().__init__(app)
        self.allowed_origins = allowed_origins
    
    async def dispatch(self, request: Request, call_next):
        # Obtener el origen de la request
        origin = request.headers.get("origin")
        
        # Si es preflight (OPTIONS), responder directamente
        if request.method == "OPTIONS":
            response = Response(status_code=204)
            if origin in self.allowed_origins:
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
                response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
                response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept, Origin, X-Requested-With"
                response.headers["Access-Control-Max-Age"] = "3600"
            return response
        
        # Procesar la request normalmente
        response = await call_next(request)
        
        # Añadir headers CORS solo si el origen está permitido
        if origin in self.allowed_origins:
            # Limpiar cualquier header CORS existente
            if "access-control-allow-origin" in response.headers:
                del response.headers["access-control-allow-origin"]
            if "access-control-allow-credentials" in response.headers:
                del response.headers["access-control-allow-credentials"]
            
            # Añadir headers correctos
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Expose-Headers"] = "*"
        
        return response
