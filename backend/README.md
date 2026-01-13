# Sirona Backend - API FastAPI

Backend del Sistema Seguro de Historiales Médicos Sirona. API RESTful construida con **FastAPI** y **MongoDB**, implementando principios de **Zero Trust** y seguridad según **Common Criteria**.

## 🏗️ Arquitectura

```
backend/
├── main.py                 # Punto de entrada de la aplicación
├── config.py              # Configuración y variables de entorno
├── requirements.txt       # Dependencias Python
├── middleware/            # Middlewares personalizados
│   └── rate_limiter.py   # Rate limiting para endpoints
├── models/               # Modelos de datos (Pydantic/Beanie)
│   ├── user.py
│   ├── patient.py
│   └── appointment.py
├── routers/              # Endpoints organizados por módulo
│   ├── auth.py          # Autenticación y autorización
│   ├── patients.py      # Gestión de pacientes
│   └── appointments.py  # Gestión de citas
├── services/            # Lógica de negocio
│   ├── db.py           # Conexión a MongoDB
│   ├── auth_service.py # Servicios de autenticación
│   └── jwt_service.py  # Generación y validación JWT
└── utils/              # Utilidades y helpers
    └── security.py     # Funciones de seguridad
```

---

## 🚀 Inicio rápido

### Requisitos

- **Python 3.11+**
- **MongoDB** (local o Atlas)
- **pip** o **poetry** para gestión de dependencias

### Instalación

1. **Crear entorno virtual:**

```bash
cd backend
python -m venv .venv
```

2. **Activar entorno virtual:**

```bash
# Windows
.venv\Scripts\activate

# Linux/Mac
source .venv/bin/activate
```

3. **Instalar dependencias:**

```bash
pip install -r requirements.txt
```

4. **Configurar variables de entorno:**

Crear archivo `.env` en la raíz de `backend/`:

```env
# MongoDB
MONGODB_URL=mongodb://localhost:27017
DB_NAME=sirona
AUDIT_DB_NAME=sirona_audit

# JWT
JWT_SECRET_KEY=tu_clave_secreta_muy_segura_cambiar_en_produccion
JWT_ALGORITHM=HS256
JWT_EXP_MINUTES=30

# Rate Limiting
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW_SECONDS=60

# Seguridad
BCRYPT_ROUNDS=12
```

5. **Ejecutar la aplicación:**

```bash
# Modo desarrollo con auto-reload
uvicorn main:app --reload --host localhost --port 8000

# O directamente con Python
python main.py
```

La API estará disponible en: `http://localhost:8000`

---

## 📚 Documentación API

FastAPI genera documentación automática:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

---

## 🔐 Seguridad implementada

### Rate Limiting

El middleware `RateLimitMiddleware` limita las peticiones por IP:

- **Límite por defecto:** 10 requests / 60 segundos
- **Respuesta al exceder:** `429 Too Many Requests`

### Autenticación JWT

- Tokens con expiración configurable (default: 30 min)
- Algoritmo: HS256
- Refresh tokens para renovación segura

### Hashing de contraseñas

- **Bcrypt** con 12 rondas de salt
- Validación de políticas de contraseñas (mínimo 8 caracteres, mayúsculas, números)

### CORS configurado

Permite peticiones desde:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000`
- `http://localhost`

---

## 🗂️ Modelos de datos

### User (models/user.py)

```python
{
  "email": "string",
  "nombre": "string",
  "apellido": "string",
  "rol": "Médico | Paciente | Secretario | Administrador",
  "password_hash": "string",
  "mfa_enabled": "boolean",
  "created_at": "datetime"
}
```

### Patient (models/patient.py)

```python
{
  "user_id": "ObjectId",
  "dni": "string",
  "fecha_nacimiento": "date",
  "telefono": "string",
  "direccion": "string",
  "historial_medico": []
}
```

### Appointment (models/appointment.py)

```python
{
  "patient_id": "ObjectId",
  "medico_id": "ObjectId",
  "fecha": "datetime",
  "tipo": "string",
  "estado": "Pendiente | Confirmada | Cancelada | Completada",
  "notas": "string"
}
```

---

## 📡 Endpoints principales

### Autenticación (`/api/auth`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Registrar nuevo usuario | ❌ |
| POST | `/login` | Iniciar sesión (retorna JWT) | ❌ |
| POST | `/refresh` | Renovar token expirado | ✅ |
| GET | `/me` | Obtener usuario actual | ✅ |

### Pacientes (`/api/paciente`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/` | Crear paciente | ✅ |
| GET | `/{id}` | Obtener paciente por ID | ✅ |
| PUT | `/{id}` | Actualizar paciente | ✅ |
| DELETE | `/{id}` | Eliminar paciente | ✅ |

### Citas (`/api/appointments`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/` | Crear cita | ✅ |
| GET | `/` | Listar citas (filtros disponibles) | ✅ |
| GET | `/{id}` | Obtener cita por ID | ✅ |
| PUT | `/{id}` | Actualizar cita | ✅ |
| DELETE | `/{id}` | Cancelar cita | ✅ |

---

## 🧪 Pruebas

```bash
# Ejecutar todas las pruebas
pytest

# Con cobertura
pytest --cov=. --cov-report=html

# Pruebas específicas
pytest tests/test_auth.py
pytest tests/test_patients.py -v
```

---

## 📋 Estándares de código

### Convenciones de nombres

- **Archivos y carpetas:** `snake_case`
- **Funciones y variables:** `snake_case`
- **Clases:** `PascalCase`
- **Constantes:** `UPPER_SNAKE_CASE`

### Linting y formateo

```bash
# Instalar herramientas de desarrollo
pip install ruff black isort

# Ejecutar linter
ruff check .

# Formatear código
black .
isort .
```

---

## 🔧 Variables de entorno

| Variable | Descripción | Requerida | Default |
|----------|-------------|-----------|---------|
| `MONGODB_URL` | URL de conexión MongoDB | ✅ | - |
| `DB_NAME` | Nombre de BD principal | ✅ | `sirona` |
| `AUDIT_DB_NAME` | Nombre de BD auditoría | ✅ | `sirona_audit` |
| `JWT_SECRET_KEY` | Clave secreta JWT | ✅ | - |
| `JWT_ALGORITHM` | Algoritmo JWT | ❌ | `HS256` |
| `JWT_EXP_MINUTES` | Tiempo de expiración token | ❌ | `30` |
| `RATE_LIMIT_REQUESTS` | Máx. requests por ventana | ❌ | `10` |
| `RATE_LIMIT_WINDOW_SECONDS` | Ventana de tiempo (segundos) | ❌ | `60` |
| `BCRYPT_ROUNDS` | Rondas de hashing Bcrypt | ❌ | `12` |

---

## 🐛 Troubleshooting

### Error: "No module named 'motor'"

```bash
pip install motor pymongo
```

### Error: "Connection refused" a MongoDB

Verificar que MongoDB esté corriendo:

```bash
# Windows (MongoDB como servicio)
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

### Error: Rate limit muy restrictivo en desarrollo

Ajustar en `main.py` o `.env`:

```python
app.add_middleware(RateLimitMiddleware, max_requests=100, window_seconds=60)
```

---

## 📦 Dependencias principales

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `fastapi` | 0.128.0 | Framework web |
| `uvicorn` | 0.40.0 | Servidor ASGI |
| `motor` | 3.7.1 | Driver async MongoDB |
| `beanie` | 2.0.1 | ODM para MongoDB |
| `pydantic` | 2.12.5 | Validación de datos |
| `python-jose` | 3.5.0 | JWT tokens |
| `bcrypt` | 5.0.0 | Hashing de contraseñas |
| `passlib` | 1.7.4 | Gestión de contraseñas |

---

## 🤝 Contribuir

Ver [`../README.md`](../README.md) para:
- Convenciones de commits
- Estrategia de ramas
- Proceso de Pull Request

---

## 📝 Roadmap

- [ ] Implementar MFA con TOTP (PBI-3)
- [ ] Añadir logs de auditoría a WORM storage (PBI-10)
- [ ] Cifrado AES-256 en BD (PBI-15)
- [ ] Tests de integración completos
- [ ] Documentación OpenAPI extendida
- [ ] Health checks y métricas

---

## 📄 Licencia

Proyecto interno DSS - Todos los derechos reservados.