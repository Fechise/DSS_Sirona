from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict, Tuple
import asyncio


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware para limitar las solicitudes a 10 req/min por IP.
    """
    def __init__(self, app, max_requests: int = 10, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.request_times: Dict[str, list] = defaultdict(list)
        self.lock = asyncio.Lock()
    
    async def dispatch(self, request: Request, call_next):
        # Obtener IP del cliente
        client_ip = request.client.host
        
        # Obtener timestamp actual
        now = datetime.utcnow()
        
        async with self.lock:
            # Limpiar timestamps antiguos (fuera de la ventana)
            cutoff_time = now - timedelta(seconds=self.window_seconds)
            self.request_times[client_ip] = [
                ts for ts in self.request_times[client_ip] 
                if ts > cutoff_time
            ]
            
            # Verificar límite
            if len(self.request_times[client_ip]) >= self.max_requests:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Maximum {self.max_requests} requests per {self.window_seconds} seconds."
                )
            
            # Registrar nueva solicitud
            self.request_times[client_ip].append(now)
        
        # Continuar con la solicitud
        response = await call_next(request)
        
        # Agregar headers informativos
        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(
            self.max_requests - len(self.request_times[client_ip])
        )
        
        return response
