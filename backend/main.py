from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

import uvicorn
from services.db import init_db, close_db
from routers import auth, appointments, patients
from middleware.rate_limiter import RateLimitMiddleware
from uvicorn import *


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Maneja el ciclo de vida de la aplicación:
    - Startup: Conecta a MongoDB
    - Shutdown: Cierra la conexión
    """
    # Startup
    await init_db()
    yield
    # Shutdown
    await close_db()


# Crear aplicación con lifespan
app = FastAPI(
    title="Sirona API",
    description="Sistema de Gestión Hospitalaria",
    version="1.0.0",
    lifespan=lifespan
)

# Configurar orígenes permitidos desde variable de entorno o valores por defecto
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
# Añadir orígenes de producción si no están
prod_origins = ["https://www.ecuconsult.net", "https://ecuconsult.net"]
for origin in prod_origins:
    if origin not in allowed_origins:
        allowed_origins.append(origin)

# Configurar CORS - Zero Trust: solo orígenes explícitos
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
    expose_headers=["*"],
    max_age=3600,
)

# Configurar Rate Limiting (10 req/min)
app.add_middleware(RateLimitMiddleware, max_requests=10, window_seconds=60)


@app.get("/")
async def root():
    return {
        "message": "Sirona API - Sistema de Gestión Hospitalaria",
        "version": "1.0.0",
        "status": "online"
    }

# Registrar routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(appointments.router, prefix="/api", tags=["Appointments"])
app.include_router(patients.router, prefix="/api/paciente", tags=["Patients"])

uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
