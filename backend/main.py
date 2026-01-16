from fastapi import FastAPI
from contextlib import asynccontextmanager
import os

import uvicorn
from services.db import init_db, close_db
from routers import auth, appointments, patients, admin
from middleware.rate_limiter import RateLimitMiddleware
from middleware.cors_handler import CustomCORSMiddleware
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

<<<<<<< HEAD
# Configurar orígenes permitidos desde variable de entorno o valores por defecto
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
# Añadir orígenes de producción si no están
prod_origins = ["https://www.ecuconsult.net", "https://ecuconsult.net"]
for origin in prod_origins:
    if origin not in allowed_origins:
        allowed_origins.append(origin)

# Configurar CORS personalizado - Evita conflictos con headers del hosting
app.add_middleware(CustomCORSMiddleware, allowed_origins=allowed_origins)
=======
# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "https://www.ecuconsult.net"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
>>>>>>> c0bfe8053f57a941960b020e285bb9ef323643eb

# Configurar Rate Limiting (100 req/min para desarrollo)
app.add_middleware(RateLimitMiddleware, max_requests=100, window_seconds=60)


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
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])

uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
<<<<<<< HEAD
=======

>>>>>>> c0bfe8053f57a941960b020e285bb9ef323643eb
