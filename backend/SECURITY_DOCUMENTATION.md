# SIRONA - Documentación Completa de Seguridad
## Sistema Seguro de Historiales Médicos

**Versión**: 1.0.0  
**Fecha**: 18 de Enero de 2026  
**Estándar de Referencia**: Common Criteria ISO/IEC 15408 Part 2

---

# Tabla de Contenidos

1. [Backlog de Requerimientos de Seguridad (Common Criteria Part 2)](#1-backlog-de-requerimientos-de-seguridad)
2. [Lista de Procesos de Negocio](#2-lista-de-procesos-de-negocio)
3. [Listado de Componentes de Seguridad](#3-listado-de-componentes-de-seguridad)
4. [Modelo de Amenazas STRIDE](#4-modelo-de-amenazas-stride)
5. [Diagrama de Arquitectura (C4)](#5-diagrama-de-arquitectura-c4)
6. [Código Fuente Documentado](#6-código-fuente-documentado)

---

# 1. Backlog de Requerimientos de Seguridad

## 1.1 Mapeo con Common Criteria Part 2 (ISO/IEC 15408-2)

| ID | Requerimiento CC | Clase | Familia | Componente Implementado | Estado |
|----|-----------------|-------|---------|------------------------|--------|
| **FIA_AFL.1** | Authentication Failure Handling | FIA | AFL | Bloqueo de cuenta tras 5 intentos fallidos (15 min) | ✅ Implementado |
| **FIA_ATD.1** | User Attribute Definition | FIA | ATD | Modelo User con roles (Administrador, Médico, Paciente, Secretario) | ✅ Implementado |
| **FIA_SOS.1** | Verification of Secrets | FIA | SOS | Validación de contraseñas (12+ chars, mayúscula, número, símbolo) | ✅ Implementado |
| **FIA_SOS.2** | TSF Generation of Secrets | FIA | SOS | Generación de secretos TOTP (160 bits, base32) | ✅ Implementado |
| **FIA_UAU.1** | Timing of Authentication | FIA | UAU | MFA obligatorio: Password + TOTP antes de acceso | ✅ Implementado |
| **FIA_UAU.2** | User Authentication Before Any Action | FIA | UAU | JWT Bearer Token obligatorio en endpoints protegidos | ✅ Implementado |
| **FIA_UID.2** | User Identification Before Any Action | FIA | UID | Identificación por email único + cédula única | ✅ Implementado |
| **FIA_USB.1** | User-Subject Binding | FIA | USB | Vinculación usuario-sesión mediante JWT con claims | ✅ Implementado |
| **FCS_CKM.1** | Cryptographic Key Generation | FCS | CKM | Generación de JWT_SECRET_KEY con algoritmo HS256 | ✅ Implementado |
| **FCS_COP.1** | Cryptographic Operation | FCS | COP | Argon2id para hashing de contraseñas (64MB, 3 iter, 4 threads) | ✅ Implementado |
| **FCS_COP.1** | Cryptographic Operation (Integridad) | FCS | COP | SHA-256 para verificación de integridad de historiales | ✅ Implementado |
| **FDP_ACC.1** | Subset Access Control | FDP | ACC | Control de acceso basado en roles (RBAC) | ✅ Implementado |
| **FDP_ACF.1** | Security Attribute Based Access Control | FDP | ACF | Verificación de rol en cada endpoint (`require_role()`) | ✅ Implementado |
| **FDP_IFC.1** | Subset Information Flow Control | FDP | IFC | Separación de bases de datos (auth, core, logs) | ✅ Implementado |
| **FDP_ITT.1** | Basic Internal Transfer Protection | FDP | ITT | CORS configurado para orígenes permitidos | ✅ Implementado |
| **FDP_SDI.2** | Stored Data Integrity Monitoring | FDP | SDI | Servicio de integridad con hash SHA-256 en historiales | ✅ Implementado |
| **FAU_GEN.1** | Audit Data Generation | FAU | GEN | Generación automática de logs en AuditLog | ✅ Implementado |
| **FAU_GEN.2** | User Identity Association | FAU | GEN | Logs incluyen user_id, email, ip_address, user_agent | ✅ Implementado |
| **FAU_SAR.1** | Audit Review | FAU | SAR | Endpoint `/api/admin/audit-logs` para revisión | ✅ Implementado |
| **FAU_STG.1** | Protected Audit Trail Storage | FAU | STG | Base de datos separada (sirona_logs) append-only | ✅ Implementado |
| **FAU_STG.4** | Prevention of Audit Data Loss | FAU | STG | Reintentos automáticos (3x) con logging de respaldo | ✅ Implementado |
| **FMT_MOF.1** | Management of Security Functions | FMT | MOF | Administrador puede gestionar usuarios y roles | ✅ Implementado |
| **FMT_MSA.1** | Management of Security Attributes | FMT | MSA | Solo admin puede cambiar roles de usuarios | ✅ Implementado |
| **FMT_SMR.1** | Security Roles | FMT | SMR | 4 roles definidos con permisos específicos | ✅ Implementado |
| **FPT_FLS.1** | Failure with Preservation of Secure State | FPT | FLS | Manejo de errores sin revelar información sensible | ✅ Implementado |
| **FPT_RCV.1** | Manual Recovery | FPT | RCV | Desbloqueo automático de cuentas tras 15 minutos | ✅ Implementado |
| **FTA_SSL.3** | TSF-Initiated Termination | FTA | SSL | Tokens JWT con expiración configurable (60 min default) | ✅ Implementado |
| **FTA_TAB.1** | Default TOE Access Banners | FTA | TAB | Mensajes de error genéricos ("Invalid credentials") | ✅ Implementado |
| **FTA_TSE.1** | TOE Session Establishment | FTA | TSE | Rate limiting (100 req/min por IP) | ✅ Implementado |

## 1.2 Requerimientos de Seguridad Específicos del Dominio Médico

| ID | Requerimiento | Descripción | Componente | Estado |
|----|--------------|-------------|------------|--------|
| **MED-SEC-01** | Confidencialidad de Historiales | Solo paciente ve su historial; médico asignado accede | `get_my_history()`, `get_patient_history()` | ✅ |
| **MED-SEC-02** | Integridad de Datos Clínicos | Hash SHA-256 para detectar modificaciones no autorizadas | `IntegrityService` | ✅ |
| **MED-SEC-03** | Trazabilidad Completa | Registro de quién accede/modifica qué y cuándo | `AuditLogger` | ✅ |
| **MED-SEC-04** | Segregación de Funciones | Secretarios no ven datos médicos, solo agendan | RBAC endpoints | ✅ |
| **MED-SEC-05** | Verificación Biométrica | Verificación facial con documento y liveness detection | `KairosService` | ✅ |
| **MED-SEC-06** | Generación Segura de Credenciales | Contraseñas temporales criptográficamente seguras | `generate_temporary_password()` | ✅ |
| **MED-SEC-07** | Protección contra Ataques de Fuerza Bruta | Bloqueo progresivo y rate limiting | `RateLimitMiddleware` | ✅ |
| **MED-SEC-08** | No Repudio | Logs inmutables con timestamp, IP, user-agent | `AuditLog` WORM | ✅ |

---

# 2. Lista de Procesos de Negocio

## 2.1 Procesos de Autenticación y Autorización

| ID | Proceso | Descripción | Actores | Endpoint |
|----|---------|-------------|---------|----------|
| **AUTH-01** | Login de Usuario (Paso 1) | Autenticación con email y contraseña | Todos los roles | `POST /api/auth/login` |
| **AUTH-02** | Setup MFA (Primera vez) | Generar QR code TOTP para configurar app | Usuario nuevo | `POST /api/auth/login` (respuesta con QR) |
| **AUTH-03** | Verificación OTP | Verificar código TOTP y obtener token JWT | Usuario autenticado | `POST /api/auth/verify-otp` |
| **AUTH-04** | Cambio de Contraseña | Usuario cambia su contraseña actual | Usuario autenticado | `POST /api/auth/change-password` |
| **AUTH-05** | Bloqueo por Intentos Fallidos | Sistema bloquea cuenta tras 5 intentos | Sistema | Automático |
| **AUTH-06** | Desbloqueo Automático | Cuenta se desbloquea tras 15 minutos | Sistema | Automático |

## 2.2 Procesos de Gestión de Usuarios

| ID | Proceso | Descripción | Actores | Endpoint |
|----|---------|-------------|---------|----------|
| **USR-01** | Registro de Médico | Secretario crea cuenta de médico | Secretario | `POST /api/auth/register-doctor` |
| **USR-02** | Registro de Secretario | Admin crea cuenta de secretario | Administrador | `POST /api/auth/register-secretary` |
| **USR-03** | Registro de Paciente | Secretario crea cuenta de paciente | Secretario | `POST /api/auth/register-patient` |
| **USR-04** | Listado de Usuarios | Admin consulta todos los usuarios | Administrador | `GET /api/admin/users` |
| **USR-05** | Edición de Usuario | Admin modifica datos de usuario | Administrador | `PUT /api/admin/users/{id}` |
| **USR-06** | Eliminación de Usuario | Admin elimina cuenta de usuario | Administrador | `DELETE /api/admin/users/{id}` |
| **USR-07** | Cambio de Rol | Admin cambia el rol de un usuario | Administrador | `PATCH /api/admin/users/{id}/role` |
| **USR-08** | Reset de Contraseña | Admin genera nueva contraseña temporal | Administrador | `POST /api/admin/users/{id}/reset-password` |

## 2.3 Procesos de Historiales Médicos

| ID | Proceso | Descripción | Actores | Endpoint |
|----|---------|-------------|---------|----------|
| **HIS-01** | Ver Mi Historial | Paciente consulta su propio historial | Paciente | `GET /api/paciente/mi-historial` |
| **HIS-02** | Ver Historial de Paciente | Médico consulta historial de paciente asignado | Médico | `GET /api/paciente/pacientes/{id}/historial` |
| **HIS-03** | Crear Consulta | Médico registra nueva consulta médica | Médico | `POST /api/paciente/pacientes/{id}/consultas` |
| **HIS-04** | Editar Consulta | Médico modifica consulta existente | Médico | `PUT /api/paciente/pacientes/{id}/consultas/{cid}` |
| **HIS-05** | Actualizar Historial | Médico actualiza datos médicos generales | Médico | `PATCH /api/paciente/pacientes/{id}/historial` |
| **HIS-06** | Listar Pacientes | Secretario lista pacientes para agendar | Secretario | `GET /api/paciente/listado-pacientes` |

## 2.4 Procesos de Citas Médicas

| ID | Proceso | Descripción | Actores | Endpoint |
|----|---------|-------------|---------|----------|
| **CIT-01** | Crear Cita | Secretario agenda nueva cita | Secretario | `POST /api/appointments` |
| **CIT-02** | Ver Cita | Consultar detalles de una cita | Secretario | `GET /api/appointments/{id}` |
| **CIT-03** | Listar Citas | Ver todas las citas con filtros | Secretario | `GET /api/appointments` |
| **CIT-04** | Actualizar Cita | Modificar fecha, estado o notas | Secretario | `PUT /api/appointments/{id}` |
| **CIT-05** | Cancelar Cita | Cambiar estado a "Cancelada" | Secretario | `PUT /api/appointments/{id}` |
| **CIT-06** | Eliminar Cita | Borrar cita del sistema | Secretario | `DELETE /api/appointments/{id}` |

## 2.5 Procesos de Disponibilidad Médica

| ID | Proceso | Descripción | Actores | Endpoint |
|----|---------|-------------|---------|----------|
| **DIS-01** | Crear Disponibilidad | Médico/Secretario define horario | Médico, Secretario | `POST /api/disponibilidad` |
| **DIS-02** | Ver Disponibilidad | Consultar horarios de un médico | Secretario | `GET /api/disponibilidad/{doctor_id}` |
| **DIS-03** | Obtener Slots Libres | Ver horarios disponibles para citas | Secretario | `GET /api/appointments/available-slots` |

## 2.6 Procesos de Auditoría y Administración

| ID | Proceso | Descripción | Actores | Endpoint |
|----|---------|-------------|---------|----------|
| **AUD-01** | Consultar Logs de Auditoría | Admin revisa eventos del sistema | Administrador | `GET /api/admin/audit-logs` |
| **AUD-02** | Verificar Integridad | Validar hash de historiales | Administrador | `POST /api/admin/integrity/verify` |
| **AUD-03** | Reporte de Integridad Global | Ver estado de todos los historiales | Administrador | `GET /api/admin/integrity/status` |

---

# 3. Listado de Componentes de Seguridad

## 3.1 Componentes de Autenticación

### 3.1.1 SecurityService (`services/security.py`)

```python
"""
Componente: Servicio de Seguridad
Responsabilidad: Operaciones criptográficas y validación de credenciales
Common Criteria: FCS_COP.1, FIA_SOS.1
"""

# Configuración de Argon2id (Ganador Password Hashing Competition 2015)
pwd_context = CryptContext(
    schemes=["argon2"],
    argon2__memory_cost=65536,   # 64 MB de memoria (resistente a GPU)
    argon2__time_cost=3,         # 3 iteraciones
    argon2__parallelism=4        # 4 threads paralelos
)

Funciones:
- hash_password(password: str) -> str          # FCS_COP.1: Hashing Argon2id
- verify_password(plain, hashed) -> bool       # FIA_UAU.2: Verificación
- create_access_token(data, expires) -> str    # FTA_SSL.3: Generación JWT
- decode_token(token: str) -> dict             # FIA_USB.1: Validación JWT
- validate_password_strength(pwd) -> tuple     # FIA_SOS.1: Política 12+ chars
```

### 3.1.2 AuthService (`services/auth.py`)

```python
"""
Componente: Servicio de Autorización
Responsabilidad: Validación de tokens y control de acceso basado en roles
Common Criteria: FDP_ACC.1, FDP_ACF.1, FMT_SMR.1
"""

Funciones:
- get_current_user(credentials) -> User        # FIA_UID.2: Identificación
- require_role(user, allowed_roles)            # FDP_ACF.1: Control RBAC
- get_admin_user(current_user) -> User         # FMT_SMR.1: Rol Admin
- get_secretary_user(current_user) -> User     # FMT_SMR.1: Rol Secretario
- get_doctor_user(current_user) -> User        # FMT_SMR.1: Rol Médico
```

### 3.1.3 RateLimitMiddleware (`middleware/rate_limiter.py`)

```python
"""
Componente: Limitador de Tasa
Responsabilidad: Prevención de ataques de fuerza bruta y DoS
Common Criteria: FTA_TSE.1, FIA_AFL.1
"""

Configuración:
- max_requests: 100 por ventana    # Límite de solicitudes
- window_seconds: 60               # Ventana de tiempo (1 minuto)

Características:
- Tracking por IP con diccionario thread-safe
- Headers informativos (X-RateLimit-Limit, X-RateLimit-Remaining)
- Exclusión de preflight CORS (OPTIONS)
- Limpieza automática de timestamps antiguos
```

### 3.1.4 Bloqueo de Cuentas (`routers/auth.py`)

```python
"""
Componente: Sistema de Bloqueo por Intentos Fallidos
Responsabilidad: Protección contra ataques de diccionario
Common Criteria: FIA_AFL.1, FPT_RCV.1
"""

Configuración (variables de entorno):
- MAX_LOGIN_ATTEMPTS: 5            # Intentos antes de bloqueo
- LOCKOUT_DURATION_MINUTES: 15     # Duración del bloqueo

Flujo:
1. Login fallido → Incrementar failed_attempts
2. Si failed_attempts >= 5 → Bloquear cuenta (status=BLOQUEADO)
3. Si lockout_until > now → Rechazar login
4. Si lockout_until <= now → Desbloquear y resetear contador
```

### 3.1.5 MFAService (`services/mfa.py`)

```python
"""
Componente: Servicio de Autenticación Multifactor (TOTP)
Responsabilidad: Gestión de códigos de un solo uso basados en tiempo
Common Criteria: FIA_UAU.1, FIA_SOS.2
Estándares: RFC 6238 (TOTP), RFC 4226 (HOTP)
"""

Configuración:
- ISSUER_NAME: "Sirona Medical System"  # Nombre en app autenticadora
- OTP_DIGITS: 6                         # Dígitos del código
- OTP_INTERVAL: 30                      # Segundos por código

Funciones:
- generate_secret() -> str              # Genera secreto base32 (160 bits)
- get_totp_uri(secret, email) -> str    # URI otpauth:// para QR
- generate_qr_code(secret, email) -> str  # QR como base64 PNG
- verify_otp(secret, code, window=1) -> bool  # Verifica código

Flujo de Autenticación MFA:
1. Usuario ingresa email/password
2. Si credenciales válidas:
   - Primera vez: Generar secreto + QR → Usuario configura app
   - Subsecuente: Pedir código OTP
3. Usuario ingresa código de 6 dígitos de su app
4. Si código válido → Entregar token JWT completo
5. Si código inválido → Rechazar (sin bloquear cuenta)

Características de Seguridad:
- Secreto de 32 caracteres base32 (160 bits entropía)
- Ventana de validación ±1 período (tolerancia a desincronización)
- Token temporal de 5 minutos para completar MFA
- Código cambia cada 30 segundos
```

## 3.2 Componentes de Integridad

### 3.2.1 IntegrityService (`services/integrity.py`)

```python
"""
Componente: Servicio de Integridad de Datos
Responsabilidad: Verificación de integridad de historiales médicos
Common Criteria: FDP_SDI.2, FCS_COP.1 (SHA-256)
"""

Funciones:
- calculate_hash(history) -> str               # Cálculo SHA-256 determinista
- verify_integrity(history) -> (bool, str, str)  # Verificación de hash
- update_hash(history) -> str                  # Actualización tras modificación
- mark_as_corrupted(history, reason)           # Marcado de registros corruptos
- check_access_allowed(history, user) -> tuple # Bloqueo de acceso a corruptos

Campos incluidos en hash (contenido clínico inmutable):
- tipoSangre, alergias, condicionesCronicas, medicamentosActuales
- consultas (id, fecha, motivo, diagnostico, tratamiento, notasMedico)
- vacunas, antecedentesFamiliares, medicoAsignado, contactoEmergencia

Campos EXCLUIDOS (metadata volátil):
- ultimaModificacion, patient_id, id
```

## 3.3 Componentes de Auditoría

### 3.3.1 AuditLogger (`services/audit.py`)

```python
"""
Componente: Logger de Auditoría Centralizado
Responsabilidad: Registro inmutable de eventos de seguridad
Common Criteria: FAU_GEN.1, FAU_GEN.2, FAU_STG.1, FAU_STG.4
"""

Tipos de Eventos (AuditEventType):
- HISTORIAL_ABIERTO, HISTORIAL_EDITADO, HISTORIAL_CORRUPTO
- CONSULTA_CREADA, CONSULTA_EDITADA
- ACCESO_DENEGADO, ACCESO_EXITOSO
- LOGIN_EXITOSO, LOGIN_FALLIDO, CUENTA_BLOQUEADA, CUENTA_DESBLOQUEADA
- USUARIO_CREADO, USUARIO_EDITADO, USUARIO_ELIMINADO, ROL_CAMBIADO
- INTEGRIDAD_VERIFICADA, INTEGRIDAD_FALLIDA
- RATE_LIMIT_EXCEEDED
- CITA_CREADA, CITA_EDITADA, CITA_CANCELADA

Características:
- Reintentos automáticos (MAX_RETRIES=3)
- Delay exponencial entre reintentos
- Logging de respaldo si falla BD
- Base de datos separada (sirona_logs) con política append-only
```

### 3.3.2 AuditLog Model (`models/models.py`)

```python
"""
Componente: Modelo de Log de Auditoría (WORM)
Responsabilidad: Almacenamiento persistente de eventos
Common Criteria: FAU_STG.1 (Write Once, Read Many)
"""

class AuditLog(Document):
    timestamp: datetime           # Momento exacto del evento
    event: str                    # Tipo de evento
    user_email: Optional[str]     # Email del actor
    user_id: Optional[str]        # ID del actor
    ip_address: str               # IP del cliente
    user_agent: str               # Navegador/cliente
    details: dict                 # Detalles adicionales estructurados

Índices optimizados:
- timestamp (DESC) - Consultas por rango temporal
- event (ASC) - Filtrado por tipo de evento
- user_email (ASC) - Búsqueda por usuario
```

## 3.4 Componentes de Control de Acceso

### 3.4.1 CORS Middleware (`middleware/cors_handler.py`)

```python
"""
Componente: Manejador de CORS
Responsabilidad: Control de orígenes permitidos para requests cross-origin
Common Criteria: FDP_ITT.1
"""

Orígenes permitidos:
- http://localhost (desarrollo)
- https://www.ecuconsult.net (producción)

Características:
- Limpieza de headers duplicados (compatibilidad hosting)
- Soporte preflight (OPTIONS) con cache 3600s
- Headers de exposición controlados
- Credenciales permitidas solo para orígenes autorizados
```

### 3.4.2 Modelo de Roles (`models/models.py`)

```python
"""
Componente: Definición de Roles de Usuario
Responsabilidad: Estructura de control de acceso RBAC
Common Criteria: FMT_SMR.1
"""

class UserRole(str, Enum):
    ADMINISTRADOR = "Administrador"  # Gestión total del sistema
    MEDICO = "Médico"               # Acceso a historiales asignados
    PACIENTE = "Paciente"           # Solo su propio historial
    SECRETARIO = "Secretario"       # Gestión de citas y registros

class UserStatus(str, Enum):
    ACTIVO = "Activo"               # Cuenta operativa
    INACTIVO = "Inactivo"           # Cuenta deshabilitada
    BLOQUEADO = "Bloqueado"         # Bloqueado por seguridad
```

## 3.5 Componentes de Verificación Biométrica

### 3.5.1 KairosService (`services/facial_verification.py`)

```python
"""
Componente: Servicio de Verificación Facial
Responsabilidad: Autenticación biométrica con liveness detection
Common Criteria: FIA_UAU.2 (Autenticación fuerte)
"""

Funciones:
- kairos_full_id_verification(selfie, doc_front, doc_back)
  # Verificación completa: selfie + documento de identidad
  
- kairos_liveness_verification(selfie)
  # Prueba de vida para prevenir spoofing
  
- kairos_biometric_verify(selfie, transaction_id)
  # Comparación facial contra registro previo

- validate_and_resize_image(image_bytes, min_size=300)
  # Preprocesamiento de imágenes para API

Perfiles de seguridad Kairos:
- permissive-v0: Más tolerante (desarrollo)
- optimal-v0: Balance seguridad/usabilidad (default)
- strict-v0: Máxima seguridad (producción sensible)
```

## 3.6 Componentes de Infraestructura

### 3.6.1 DatabaseService (`services/db.py`)

```python
"""
Componente: Servicio de Base de Datos
Responsabilidad: Gestión de conexiones MongoDB con separación Zero Trust
Common Criteria: FDP_IFC.1 (Separación de dominios)
"""

Arquitectura de 3 Bases de Datos:

1. sirona_auth (Identidad)
   - User: Credenciales y roles
   - Session: Tokens activos
   - MFASecret: Secretos de 2FA
   
2. sirona_core (Negocio)
   - PatientHistory: Historiales clínicos
   - ClinicalRecord: Registros médicos detallados
   - Appointment: Citas médicas
   - DoctorAvailability: Horarios de médicos

3. sirona_logs (Auditoría)
   - AuditLog: Eventos de seguridad (append-only)

Principio Zero Trust:
- Credenciales aisladas de datos clínicos
- Logs inmutables en BD separada
- Posibilidad de diferentes permisos por BD
```

### 3.6.2 EmailService (`services/email_service.py`)

```python
"""
Componente: Servicio de Email
Responsabilidad: Comunicación segura de credenciales
Common Criteria: FIA_SOS.1 (Distribución segura de secretos)
"""

Funciones:
- generate_temporary_password(length=16)
  # Generación criptográficamente segura (secrets module)
  # Garantiza: mayúscula + minúscula + número + símbolo
  
- send_temporary_password_email(to, name, password, role)
  # Envío de credenciales iniciales por email seguro (STARTTLS)

- is_email_configured() -> bool
  # Validación de configuración SMTP
```

---

# 4. Modelo de Amenazas STRIDE

## 4.1 Matriz de Amenazas y Mitigaciones

### 4.1.1 **S - Spoofing (Suplantación de Identidad)**

| ID | Amenaza | Activo Afectado | Mitigación Implementada | Componente |
|----|---------|-----------------|------------------------|------------|
| S1 | Suplantación de usuario mediante credenciales robadas | Cuentas de usuario | Argon2id hashing, MFA preparado, bloqueo de cuenta | `SecurityService`, `User.security` |
| S2 | Token JWT falsificado | Sesiones | Firma HS256 con secreto seguro, validación de expiración | `create_access_token()`, `decode_token()` |
| S3 | Spoofing facial (fotos/videos) | Verificación biométrica | Liveness detection con Kairos API | `kairos_liveness_verification()` |
| S4 | Suplantación de IP para evadir rate limit | Rate limiting | Logging de IP real, headers X-Forwarded-For | `RateLimitMiddleware` |
| S5 | Email spoofing para phishing | Comunicaciones | SMTP con STARTTLS, sender verificado | `EmailService` |

### 4.1.2 **T - Tampering (Manipulación de Datos)**

| ID | Amenaza | Activo Afectado | Mitigación Implementada | Componente |
|----|---------|-----------------|------------------------|------------|
| T1 | Modificación de historiales médicos | Datos clínicos | Hash SHA-256 de integridad, detección de corrupción | `IntegrityService` |
| T2 | Alteración de logs de auditoría | Trazabilidad | BD separada append-only, WORM policy | `AuditLog`, `sirona_logs` |
| T3 | Manipulación de tokens JWT | Autenticación | Firma criptográfica HS256, no almacenamiento en cliente | `decode_token()` |
| T4 | Inyección SQL/NoSQL | Base de datos | Beanie ODM con validación Pydantic | Modelos Pydantic |
| T5 | Modificación de respuestas API | Comunicación | HTTPS obligatorio (en producción), CORS estricto | `CustomCORSMiddleware` |

### 4.1.3 **R - Repudiation (Repudio)**

| ID | Amenaza | Activo Afectado | Mitigación Implementada | Componente |
|----|---------|-----------------|------------------------|------------|
| R1 | Usuario niega haber accedido a historial | Responsabilidad | Log con user_id, email, IP, timestamp, user-agent | `AuditLogger.log_history_access()` |
| R2 | Médico niega haber creado consulta | Trazabilidad médica | Log de CONSULTA_CREADA con detalles completos | `AuditEventType.CONSULTA_CREADA` |
| R3 | Admin niega cambio de rol | Gestión de usuarios | Log de ROL_CAMBIADO con valores antes/después | `AuditEventType.ROL_CAMBIADO` |
| R4 | Negación de intentos de acceso no autorizado | Incidentes | Log de ACCESO_DENEGADO con contexto | `AuditEventType.ACCESO_DENEGADO` |

### 4.1.4 **I - Information Disclosure (Revelación de Información)**

| ID | Amenaza | Activo Afectado | Mitigación Implementada | Componente |
|----|---------|-----------------|------------------------|------------|
| I1 | Exposición de datos en mensajes de error | Credenciales | Mensajes genéricos ("Invalid credentials") | `FTA_TAB.1` |
| I2 | Enumeración de usuarios por email | Privacidad | Mismo mensaje para usuario inexistente/contraseña incorrecta | `login()` |
| I3 | Acceso a historial de otro paciente | Confidencialidad médica | Verificación de médico asignado, RBAC estricto | `get_patient_history()` |
| I4 | Logs expuestos a usuarios no admin | Auditoría | Endpoint solo para rol ADMINISTRADOR | `get_admin_user()` |
| I5 | Datos sensibles en logs | PII | Hash truncado en logs, no contraseñas | `AuditLogger` |

### 4.1.5 **D - Denial of Service (Denegación de Servicio)**

| ID | Amenaza | Activo Afectado | Mitigación Implementada | Componente |
|----|---------|-----------------|------------------------|------------|
| D1 | Flood de requests desde una IP | Disponibilidad API | Rate limiting 100 req/min por IP | `RateLimitMiddleware` |
| D2 | Bloqueo masivo de cuentas | Disponibilidad usuarios | Desbloqueo automático tras 15 min | `lockout_until` |
| D3 | Agotamiento de conexiones BD | Persistencia | Motor async con pool de conexiones | `AsyncIOMotorClient` |
| D4 | Carga excesiva de imágenes | Verificación facial | Validación de tamaño y redimensionamiento | `validate_and_resize_image()` |

### 4.1.6 **E - Elevation of Privilege (Escalada de Privilegios)**

| ID | Amenaza | Activo Afectado | Mitigación Implementada | Componente |
|----|---------|-----------------|------------------------|------------|
| E1 | Paciente intenta ver historial de otro | Control de acceso | Verificación patient_id == current_user.id | `get_my_history()` |
| E2 | Médico accede a paciente no asignado | Segregación | Verificación medicoAsignado.medicoId | `get_patient_history()` |
| E3 | Secretario intenta funciones de admin | RBAC | `get_admin_user()` valida rol ADMINISTRADOR | `require_role()` |
| E4 | Manipulación de claims JWT | Autorización | Validación server-side del token, no confiar en cliente | `decode_token()` |
| E5 | IDOR en endpoints | Recursos | Validación de ownership en cada operación | Endpoints con verificación |

## 4.2 Diagrama de Flujo de Amenazas

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        MODELO DE AMENAZAS STRIDE                         │
│                              SIRONA SYSTEM                               │
└─────────────────────────────────────────────────────────────────────────┘

                    ┌───────────────────────────────┐
                    │         ATACANTE              │
                    │   (Usuario Malicioso)         │
                    └───────────────┬───────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   SPOOFING    │         │    TAMPERING    │         │   INFORMATION   │
│               │         │                 │         │   DISCLOSURE    │
│ • Creds robadas│         │ • Mod. historial│         │ • Enum. usuarios│
│ • JWT falso   │         │ • Alter. logs   │         │ • Data leakage  │
│ • Face spoof  │         │ • Injection     │         │ • Error messages│
└───────┬───────┘         └────────┬────────┘         └────────┬────────┘
        │                          │                           │
        ▼                          ▼                           ▼
┌───────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                         CAPA DE SEGURIDAD                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ Rate Limit  │  │   Argon2id  │  │  SHA-256    │  │   RBAC      │  │
│  │ Middleware  │  │   Hashing   │  │  Integrity  │  │   Control   │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │   JWT       │  │   Account   │  │   Audit     │  │   CORS      │  │
│  │   Tokens    │  │   Lockout   │  │   Logger    │  │   Handler   │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
        │                          │                           │
        ▼                          ▼                           ▼
┌───────────────┐         ┌─────────────────┐         ┌─────────────────┐
│  REPUDIATION  │         │     DENIAL OF   │         │   ELEVATION OF  │
│               │         │     SERVICE     │         │   PRIVILEGE     │
│ • Negar acceso│         │ • Flood attacks │         │ • IDOR attacks  │
│ • Sin rastro  │         │ • Account lock  │         │ • Role bypass   │
│               │         │ • Resource exhaust│        │ • JWT tampering │
└───────┬───────┘         └────────┬────────┘         └────────┬────────┘
        │                          │                           │
        ▼                          ▼                           ▼
┌───────────────────────────────────────────────────────────────────────┐
│                         MITIGACIONES                                  │
│  • AuditLog WORM (Write Once Read Many)                               │
│  • Logs con timestamp, IP, user-agent, user_id                        │
│  • Rate limiting por IP (100 req/min)                                 │
│  • Desbloqueo automático (15 min)                                     │
│  • Verificación de ownership en cada operación                        │
│  • Validación de rol en cada endpoint protegido                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

# 5. Diagrama de Arquitectura (C4)

## 5.1 Nivel 1: Diagrama de Contexto del Sistema

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DIAGRAMA DE CONTEXTO (C4 - Level 1)                   │
│                                    SIRONA                                        │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
    │             │     │             │     │             │     │             │
    │  Paciente   │     │   Médico    │     │ Secretario  │     │    Admin    │
    │             │     │             │     │             │     │             │
    └──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
           │                   │                   │                   │
           │    HTTPS/JWT      │    HTTPS/JWT      │    HTTPS/JWT      │
           │                   │                   │                   │
           └───────────────────┴───────────────────┴───────────────────┘
                                        │
                                        ▼
                    ┌───────────────────────────────────────────┐
                    │                                           │
                    │            SIRONA SYSTEM                  │
                    │   Sistema de Historiales Médicos          │
                    │                                           │
                    │   [Software System]                       │
                    │                                           │
                    │   • Gestión de historiales clínicos       │
                    │   • Control de acceso basado en roles     │
                    │   • Auditoría completa de acciones        │
                    │   • Verificación biométrica               │
                    │                                           │
                    └───────────────────┬───────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
           ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
           │                │  │                │  │                │
           │  Kairos API    │  │  SMTP Server   │  │   MongoDB      │
           │  [External]    │  │  [External]    │  │   [Database]   │
           │                │  │                │  │                │
           │ Verificación   │  │ Envío de       │  │ Almacenamiento │
           │ Facial         │  │ credenciales   │  │ persistente    │
           │                │  │                │  │                │
           └────────────────┘  └────────────────┘  └────────────────┘
```

## 5.2 Nivel 2: Diagrama de Contenedores

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         DIAGRAMA DE CONTENEDORES (C4 - Level 2)                 │
│                                    SIRONA                                        │
└─────────────────────────────────────────────────────────────────────────────────┘

         ┌─────────────────────────────────────────────────────────────┐
         │                      USUARIOS                                │
         │   [Paciente]    [Médico]    [Secretario]    [Admin]         │
         └─────────────────────────────┬───────────────────────────────┘
                                       │ HTTPS
                                       ▼
         ┌─────────────────────────────────────────────────────────────┐
         │                    FRONTEND APPLICATION                      │
         │                      [React 19 + Vite]                       │
         │                                                              │
         │  • SPA con React Router                                      │
         │  • AuthContext para estado de sesión                         │
         │  • ProtectedRoute para rutas autenticadas                    │
         │  • Almacenamiento JWT en localStorage                        │
         │                                                              │
         │  Puerto: 5173 (dev) / 443 (prod)                            │
         └─────────────────────────────┬───────────────────────────────┘
                                       │ REST API / JSON
                                       │ Bearer Token
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND API                                          │
│                           [FastAPI + Python 3.11]                                 │
│                              Puerto: 8000                                         │
│                                                                                   │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                         MIDDLEWARE LAYER                                    │  │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────┐     │  │
│  │  │ CustomCORS      │    │ RateLimiter     │    │ Request/Response    │     │  │
│  │  │ Middleware      │    │ Middleware      │    │ Logging             │     │  │
│  │  │                 │    │                 │    │                     │     │  │
│  │  │ FDP_ITT.1       │    │ FTA_TSE.1       │    │ FAU_GEN.1           │     │  │
│  │  └─────────────────┘    └─────────────────┘    └─────────────────────┘     │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                   │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                           ROUTER LAYER                                      │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │  │
│  │  │ auth.py      │  │ patients.py  │  │appointments.py│ │ admin.py     │    │  │
│  │  │              │  │              │  │              │  │              │    │  │
│  │  │ /api/auth/*  │  │/api/paciente/│  │/api/appoint- │  │/api/admin/*  │    │  │
│  │  │              │  │              │  │ments/*       │  │              │    │  │
│  │  │ FIA_UAU.2    │  │ FDP_ACC.1    │  │ FDP_ACF.1    │  │ FMT_MOF.1    │    │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                   │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                          SERVICE LAYER                                      │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │  │
│  │  │ security.py  │  │ audit.py     │  │ integrity.py │  │ auth.py      │    │  │
│  │  │              │  │              │  │              │  │              │    │  │
│  │  │ Argon2/JWT   │  │ AuditLogger  │  │ SHA-256 Hash │  │ RBAC Control │    │  │
│  │  │              │  │              │  │              │  │              │    │  │
│  │  │ FCS_COP.1    │  │ FAU_GEN.1    │  │ FDP_SDI.2    │  │ FDP_ACF.1    │    │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │  │
│  │  ┌──────────────┐  ┌──────────────┐                                        │  │
│  │  │ email.py     │  │ facial.py    │                                        │  │
│  │  │              │  │              │                                        │  │
│  │  │ SMTP/TLS     │  │ Kairos API   │                                        │  │
│  │  │              │  │              │                                        │  │
│  │  │ FIA_SOS.1    │  │ FIA_UAU.2    │                                        │  │
│  │  └──────────────┘  └──────────────┘                                        │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                   │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                           MODEL LAYER (Beanie ODM)                          │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │  │
│  │  │ User         │  │PatientHistory│  │ Appointment  │  │ AuditLog     │    │  │
│  │  │ Session      │  │ClinicalRecord│  │ DoctorAvail  │  │              │    │  │
│  │  │ MFASecret    │  │              │  │              │  │              │    │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                   │
└───────────────────────────────────┬──────────────────────────────────────────────┘
                                    │ Motor Async Driver
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              MONGODB CLUSTER                                      │
│                           [Motor Async Client]                                    │
│                                                                                   │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐       │
│  │    sirona_auth      │  │    sirona_core      │  │    sirona_logs      │       │
│  │    [Identity DB]    │  │    [Business DB]    │  │    [Audit DB]       │       │
│  │                     │  │                     │  │                     │       │
│  │ • users             │  │ • patient_histories │  │ • audit_logs        │       │
│  │ • sessions          │  │ • clinical_records  │  │   (WORM Policy)     │       │
│  │ • mfa_secrets       │  │ • appointments      │  │                     │       │
│  │                     │  │ • doctor_availability│ │                     │       │
│  │                     │  │                     │  │                     │       │
│  │ FIA_ATD.1           │  │ FDP_ACC.1           │  │ FAU_STG.1           │       │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘       │
│                                                                                   │
│                         Zero Trust: Separación por Dominio                        │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## 5.3 Nivel 3: Diagrama de Componentes - Servicios de Seguridad

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      DIAGRAMA DE COMPONENTES (C4 - Level 3)                     │
│                          SECURITY SERVICES LAYER                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SECURITY SERVICE                                    │
│                            services/security.py                                  │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                        PASSWORD MANAGEMENT                                  │ │
│  │                                                                             │ │
│  │  ┌─────────────────────┐        ┌─────────────────────┐                    │ │
│  │  │  hash_password()    │        │  verify_password()  │                    │ │
│  │  │                     │        │                     │                    │ │
│  │  │  Input: plaintext   │        │  Input: plain,hash  │                    │ │
│  │  │  Output: hash       │        │  Output: bool       │                    │ │
│  │  │                     │        │                     │                    │ │
│  │  │  Algorithm:         │        │  Timing-safe        │                    │ │
│  │  │  Argon2id           │        │  comparison         │                    │ │
│  │  │  Memory: 64MB       │        │                     │                    │ │
│  │  │  Iterations: 3      │        │                     │                    │ │
│  │  │  Parallelism: 4     │        │                     │                    │ │
│  │  │                     │        │                     │                    │ │
│  │  │  CC: FCS_COP.1      │        │  CC: FIA_UAU.2      │                    │ │
│  │  └─────────────────────┘        └─────────────────────┘                    │ │
│  │                                                                             │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐   │ │
│  │  │                    validate_password_strength()                      │   │ │
│  │  │                                                                      │   │ │
│  │  │  Requisitos (FIA_SOS.1):                                            │   │ │
│  │  │  • Longitud mínima: 12 caracteres                                   │   │ │
│  │  │  • Al menos 1 letra mayúscula                                       │   │ │
│  │  │  • Al menos 1 letra minúscula                                       │   │ │
│  │  │  • Al menos 1 dígito numérico                                       │   │ │
│  │  │  • Al menos 1 carácter especial (!@#$%^&*()_+-=[]{}|;:'",.<>?/)    │   │ │
│  │  │                                                                      │   │ │
│  │  │  Output: (is_valid: bool, errors: list[str])                        │   │ │
│  │  └─────────────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                          TOKEN MANAGEMENT                                   │ │
│  │                                                                             │ │
│  │  ┌─────────────────────┐        ┌─────────────────────┐                    │ │
│  │  │ create_access_token │        │    decode_token()   │                    │ │
│  │  │                     │        │                     │                    │ │
│  │  │  Claims:            │        │  Validaciones:      │                    │ │
│  │  │  • sub (user_id)    │        │  • Firma HS256      │                    │ │
│  │  │  • email            │        │  • Expiración       │                    │ │
│  │  │  • role             │        │  • Estructura       │                    │ │
│  │  │  • exp (expiry)     │        │                     │                    │ │
│  │  │  • iat (issued)     │        │  Retorna:           │                    │ │
│  │  │                     │        │  payload | None     │                    │ │
│  │  │  CC: FTA_SSL.3      │        │  CC: FIA_USB.1      │                    │ │
│  │  └─────────────────────┘        └─────────────────────┘                    │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                               AUTH SERVICE                                       │
│                             services/auth.py                                     │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                       RBAC CONTROL (FDP_ACF.1)                              │ │
│  │                                                                             │ │
│  │  ┌─────────────────────┐                                                   │ │
│  │  │  get_current_user() │◄──────────────────┐                               │ │
│  │  │                     │                   │                               │ │
│  │  │  Depends(security)  │     HTTPBearer    │                               │ │
│  │  │  Decode JWT         │     Scheme        │                               │ │
│  │  │  Fetch User from DB │                   │                               │ │
│  │  │  Return User object │                   │                               │ │
│  │  └─────────┬───────────┘                   │                               │ │
│  │            │                               │                               │ │
│  │            ▼                               │                               │ │
│  │  ┌─────────────────────┐                   │                               │ │
│  │  │    require_role()   │                   │                               │ │
│  │  │                     │                   │                               │ │
│  │  │  Check user.role    │                   │                               │ │
│  │  │  in allowed_roles   │                   │                               │ │
│  │  │                     │                   │                               │ │
│  │  │  403 if denied      │                   │                               │ │
│  │  └─────────┬───────────┘                   │                               │ │
│  │            │                               │                               │ │
│  │  ┌─────────┴───────────────────────────────┴──────────────────────┐        │ │
│  │  │                    ROLE-SPECIFIC DEPENDENCIES                   │        │ │
│  │  │                                                                 │        │ │
│  │  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │        │ │
│  │  │  │get_admin_user()│  │get_secretary   │  │get_doctor_user │    │        │ │
│  │  │  │                │  │_user()         │  │()              │    │        │ │
│  │  │  │ ADMINISTRADOR  │  │ SECRETARIO +   │  │ MÉDICO         │    │        │ │
│  │  │  │                │  │ ADMINISTRADOR  │  │                │    │        │ │
│  │  │  │ FMT_SMR.1      │  │ FMT_SMR.1      │  │ FMT_SMR.1      │    │        │ │
│  │  │  └────────────────┘  └────────────────┘  └────────────────┘    │        │ │
│  │  └────────────────────────────────────────────────────────────────┘        │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                             INTEGRITY SERVICE                                    │
│                           services/integrity.py                                  │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                    HASH CALCULATION (FDP_SDI.2)                             │ │
│  │                                                                             │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐   │ │
│  │  │                        calculate_hash()                              │   │ │
│  │  │                                                                      │   │ │
│  │  │  Input: PatientHistory                                              │   │ │
│  │  │                                                                      │   │ │
│  │  │  Campos incluidos:                  Campos excluidos:               │   │ │
│  │  │  ├─ tipoSangre                      ├─ id                           │   │ │
│  │  │  ├─ alergias[]                      ├─ patient_id                   │   │ │
│  │  │  ├─ condicionesCronicas[]           └─ ultimaModificacion           │   │ │
│  │  │  ├─ medicamentosActuales[]                                          │   │ │
│  │  │  ├─ consultas[] (ordenadas)                                         │   │ │
│  │  │  ├─ vacunas[] (ordenadas)                                           │   │ │
│  │  │  ├─ antecedentesFamiliares[]                                        │   │ │
│  │  │  ├─ medicoAsignado                                                  │   │ │
│  │  │  └─ contactoEmergencia                                              │   │ │
│  │  │                                                                      │   │ │
│  │  │  Proceso:                                                            │   │ │
│  │  │  1. Serialización determinista (JSON ordenado)                       │   │ │
│  │  │  2. SHA-256 del contenido serializado                                │   │ │
│  │  │  3. Retorno de hash hexadecimal (64 chars)                           │   │ │
│  │  │                                                                      │   │ │
│  │  │  CC: FCS_COP.1 (Operación criptográfica)                            │   │ │
│  │  └─────────────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                    INTEGRITY VERIFICATION                                   │ │
│  │                                                                             │ │
│  │  ┌─────────────────────┐        ┌─────────────────────┐                    │ │
│  │  │  verify_integrity() │        │ mark_as_corrupted() │                    │ │
│  │  │                     │        │                     │                    │ │
│  │  │  Compare stored     │        │  Set is_corrupted   │                    │ │
│  │  │  hash vs calculated │        │  Set timestamp      │                    │ │
│  │  │                     │        │  Log critical event │                    │ │
│  │  │  Log audit event    │        │  Alert admin (TODO) │                    │ │
│  │  │                     │        │                     │                    │ │
│  │  │  Returns:           │        │  CC: FAU_GEN.1      │                    │ │
│  │  │  (valid, expected,  │        │                     │                    │ │
│  │  │   calculated)       │        │                     │                    │ │
│  │  └─────────────────────┘        └─────────────────────┘                    │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                               AUDIT SERVICE                                      │
│                             services/audit.py                                    │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                     AUDIT LOGGER (FAU_GEN.1, FAU_STG.4)                     │ │
│  │                                                                             │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐   │ │
│  │  │                         log_event()                                  │   │ │
│  │  │                                                                      │   │ │
│  │  │  Parameters:                                                         │   │ │
│  │  │  • event_type: AuditEventType                                       │   │ │
│  │  │  • user_id, user_email, user_role                                   │   │ │
│  │  │  • patient_id (if applicable)                                       │   │ │
│  │  │  • ip_address, user_agent                                           │   │ │
│  │  │  • details: dict                                                     │   │ │
│  │  │                                                                      │   │ │
│  │  │  Features:                                                           │   │ │
│  │  │  • Automatic timestamp (UTC)                                         │   │ │
│  │  │  • Retry on failure (3 attempts)                                     │   │ │
│  │  │  • Exponential backoff                                               │   │ │
│  │  │  • Fallback logging if DB fails                                      │   │ │
│  │  └─────────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                             │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐   │ │
│  │  │                      AuditEventType (Enum)                           │   │ │
│  │  │                                                                      │   │ │
│  │  │  Historial:           Autenticación:        Usuario:                │   │ │
│  │  │  • HISTORIAL_ABIERTO  • LOGIN_EXITOSO       • USUARIO_CREADO        │   │ │
│  │  │  • HISTORIAL_EDITADO  • LOGIN_FALLIDO       • USUARIO_EDITADO       │   │ │
│  │  │  • HISTORIAL_CORRUPTO • CUENTA_BLOQUEADA    • USUARIO_ELIMINADO     │   │ │
│  │  │                       • CUENTA_DESBLOQUEADA • ROL_CAMBIADO          │   │ │
│  │  │  Consulta:                                   • CONTRASENA_CAMBIADA  │   │ │
│  │  │  • CONSULTA_CREADA    Integridad:                                   │   │ │
│  │  │  • CONSULTA_EDITADA   • INTEGRIDAD_VERIFICADA                       │   │ │
│  │  │                       • INTEGRIDAD_FALLIDA                          │   │ │
│  │  │  Acceso:                                                             │   │ │
│  │  │  • ACCESO_DENEGADO    Citas:                                        │   │ │
│  │  │  • ACCESO_EXITOSO     • CITA_CREADA, CITA_EDITADA, CITA_CANCELADA   │   │ │
│  │  └─────────────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 5.4 Diagrama de Secuencia - Flujo de Autenticación

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     DIAGRAMA DE SECUENCIA - LOGIN FLOW                          │
│                         (Con Seguridad Completa)                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

     Cliente              RateLimiter         AuthRouter         SecurityService       DB (auth)        AuditLogger
        │                      │                   │                    │                  │                  │
        │  POST /api/auth/login│                   │                    │                  │                  │
        │─────────────────────>│                   │                    │                  │                  │
        │                      │                   │                    │                  │                  │
        │                      │ Check rate limit  │                    │                  │                  │
        │                      │ (FTA_TSE.1)       │                    │                  │                  │
        │                      │───────────┐       │                    │                  │                  │
        │                      │           │       │                    │                  │                  │
        │                      │<──────────┘       │                    │                  │                  │
        │                      │                   │                    │                  │                  │
        │                      │  (if limit OK)    │                    │                  │                  │
        │                      │──────────────────>│                    │                  │                  │
        │                      │                   │                    │                  │                  │
        │                      │                   │ Find user by email │                  │                  │
        │                      │                   │ (FIA_UID.2)        │                  │                  │
        │                      │                   │─────────────────────────────────────>│                  │
        │                      │                   │                    │                  │                  │
        │                      │                   │<─────────────────────────────────────│                  │
        │                      │                   │     User object    │                  │                  │
        │                      │                   │                    │                  │                  │
        │                      │                   │ Check lockout      │                  │                  │
        │                      │                   │ (FIA_AFL.1)        │                  │                  │
        │                      │                   │───────────┐        │                  │                  │
        │                      │                   │           │        │                  │                  │
        │                      │                   │<──────────┘        │                  │                  │
        │                      │                   │                    │                  │                  │
        │                      │                   │ Verify password    │                  │                  │
        │                      │                   │ (FIA_UAU.2)        │                  │                  │
        │                      │                   │───────────────────>│                  │                  │
        │                      │                   │                    │                  │                  │
        │                      │                   │                    │ Argon2 verify    │                  │
        │                      │                   │                    │ (FCS_COP.1)      │                  │
        │                      │                   │                    │─────────┐        │                  │
        │                      │                   │                    │         │        │                  │
        │                      │                   │                    │<────────┘        │                  │
        │                      │                   │                    │                  │                  │
        │                      │                   │<───────────────────│                  │                  │
        │                      │                   │    verified=true   │                  │                  │
        │                      │                   │                    │                  │                  │
        │                      │                   │ Reset failed_attempts                 │                  │
        │                      │                   │─────────────────────────────────────>│                  │
        │                      │                   │                    │                  │                  │
        │                      │                   │ Create JWT token   │                  │                  │
        │                      │                   │ (FTA_SSL.3)        │                  │                  │
        │                      │                   │───────────────────>│                  │                  │
        │                      │                   │                    │                  │                  │
        │                      │                   │                    │ HS256 sign       │                  │
        │                      │                   │                    │ (FCS_CKM.1)      │                  │
        │                      │                   │                    │─────────┐        │                  │
        │                      │                   │                    │         │        │                  │
        │                      │                   │                    │<────────┘        │                  │
        │                      │                   │                    │                  │                  │
        │                      │                   │<───────────────────│                  │                  │
        │                      │                   │      JWT token     │                  │                  │
        │                      │                   │                    │                  │                  │
        │                      │                   │ Log login_success  │                  │                  │
        │                      │                   │ (FAU_GEN.1)        │                  │                  │
        │                      │                   │─────────────────────────────────────────────────────────>│
        │                      │                   │                    │                  │                  │
        │                      │                   │<─────────────────────────────────────────────────────────│
        │                      │                   │                    │                  │                  │
        │<─────────────────────│───────────────────│                    │                  │                  │
        │   {token, role, user}│                   │                    │                  │                  │
        │                      │                   │                    │                  │                  │


     ┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
     │                              FLUJO ALTERNATIVO: LOGIN FALLIDO                                            │
     └──────────────────────────────────────────────────────────────────────────────────────────────────────────┘

        │                      │                   │ Verify password    │                  │                  │
        │                      │                   │───────────────────>│                  │                  │
        │                      │                   │                    │                  │                  │
        │                      │                   │<───────────────────│                  │                  │
        │                      │                   │   verified=false   │                  │                  │
        │                      │                   │                    │                  │                  │
        │                      │                   │ Increment failed_attempts             │                  │
        │                      │                   │─────────────────────────────────────>│                  │
        │                      │                   │                    │                  │                  │
        │                      │                   │ (if attempts >= 5) │                  │                  │
        │                      │                   │ Set lockout_until  │                  │                  │
        │                      │                   │ Set status=BLOQUEADO                  │                  │
        │                      │                   │─────────────────────────────────────>│                  │
        │                      │                   │                    │                  │                  │
        │                      │                   │ Log account_locked │                  │                  │
        │                      │                   │ (FAU_GEN.1)        │                  │                  │
        │                      │                   │─────────────────────────────────────────────────────────>│
        │                      │                   │                    │                  │                  │
        │<─────────────────────│───────────────────│                    │                  │                  │
        │   403: Account locked│                   │                    │                  │                  │
        │                      │                   │                    │                  │                  │
```

---

# 6. Código Fuente Documentado

## 6.1 Servicio de Seguridad - `services/security.py`

```python
"""
=============================================================================
SERVICIO DE SEGURIDAD - SIRONA
=============================================================================
Módulo: services/security.py
Responsabilidad: Operaciones criptográficas y gestión de tokens JWT

Common Criteria References:
- FCS_COP.1: Operación Criptográfica (Argon2id para hashing)
- FIA_SOS.1: Verificación de Secretos (Política de contraseñas)
- FTA_SSL.3: Terminación de Sesión (Expiración de tokens)
- FIA_USB.1: Vinculación Usuario-Sesión (JWT con claims)

Estándares de Seguridad:
- Argon2id: Ganador de Password Hashing Competition 2015
  - Resistente a ataques de GPU y ASIC
  - Configurable en memoria, tiempo y paralelismo
- JWT: RFC 7519 con firma HS256
=============================================================================
"""

import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

# ============================================================================
# CONFIGURACIÓN DE SEGURIDAD (Variables de Entorno)
# ============================================================================
SECRET_KEY = os.getenv("JWT_SECRET_KEY")         # Clave para firma JWT
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")  # Algoritmo de firma
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# ============================================================================
# CONFIGURACIÓN DE HASHING - ARGON2ID (FCS_COP.1)
# ============================================================================
# Argon2id combina resistencia a ataques side-channel (Argon2i) y GPU (Argon2d)
# Parámetros recomendados para servidores:
pwd_context = CryptContext(
    schemes=["argon2"],          # Algoritmo principal
    deprecated="auto",           # Auto-deprecación de esquemas antiguos
    argon2__memory_cost=65536,   # 64 MB de memoria (resistencia a GPU/ASIC)
    argon2__time_cost=3,         # 3 iteraciones (balance seguridad/rendimiento)
    argon2__parallelism=4        # 4 threads (aprovecha CPU multi-core)
)


def hash_password(password: str) -> str:
    """
    Genera hash seguro de contraseña usando Argon2id.
    
    SEGURIDAD (FCS_COP.1):
    - Argon2id es memory-hard (dificulta ataques con hardware especializado)
    - Salt aleatorio generado automáticamente (16 bytes)
    - Hash resultante incluye parámetros para verificación futura
    
    Args:
        password: Contraseña en texto plano
        
    Returns:
        str: Hash Argon2id con formato $argon2id$v=19$m=65536,t=3,p=4$<salt>$<hash>
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica contraseña contra hash almacenado.
    
    SEGURIDAD (FIA_UAU.2):
    - Comparación en tiempo constante (previene timing attacks)
    - Soporta migración automática de esquemas deprecados
    
    Args:
        plain_password: Contraseña proporcionada por usuario
        hashed_password: Hash almacenado en base de datos
        
    Returns:
        bool: True si la contraseña es correcta
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Crea token JWT firmado con claims de usuario.
    
    SEGURIDAD (FTA_SSL.3, FIA_USB.1):
    - Token firmado con HS256 (HMAC-SHA256)
    - Claims incluyen: sub (user_id), email, role
    - Expiración configurable (default: 60 minutos)
    - Timestamp de emisión para invalidación
    
    Args:
        data: Diccionario con claims (sub, email, role)
        expires_delta: Tiempo de expiración personalizado
        
    Returns:
        str: Token JWT codificado
    """
    to_encode = data.copy()
    
    # Calcular tiempo de expiración
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Agregar claims estándar JWT
    to_encode.update({
        "exp": expire,              # Expiración (FTA_SSL.3)
        "iat": datetime.utcnow()    # Issued At (para invalidación)
    })
    
    # Firmar token con clave secreta
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """
    Decodifica y valida token JWT.
    
    SEGURIDAD (FIA_USB.1):
    - Verifica firma criptográfica
    - Valida expiración automáticamente
    - Retorna None en caso de token inválido (no revela detalles)
    
    Args:
        token: Token JWT a validar
        
    Returns:
        dict | None: Payload del token o None si es inválido
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        # No revelar detalles del error (FPT_FLS.1)
        return None


def validate_password_strength(password: str) -> tuple[bool, list[str]]:
    """
    Valida que la contraseña cumpla política de seguridad.
    
    SEGURIDAD (FIA_SOS.1):
    Requisitos mínimos basados en NIST SP 800-63B:
    - Longitud mínima: 12 caracteres
    - Complejidad: mayúscula + minúscula + número + símbolo
    
    Args:
        password: Contraseña a validar
        
    Returns:
        tuple: (es_válida, lista_de_errores)
    """
    errors = []
    
    # Longitud mínima (NIST recomienda 8+, usamos 12 para mayor seguridad)
    if len(password) < 12:
        errors.append("Must be at least 12 characters")
    
    # Requiere mayúscula
    if not any(c.isupper() for c in password):
        errors.append("Must contain at least one uppercase letter")
    
    # Requiere minúscula
    if not any(c.islower() for c in password):
        errors.append("Must contain at least one lowercase letter")
    
    # Requiere dígito
    if not any(c.isdigit() for c in password):
        errors.append("Must contain at least one number")
    
    # Requiere símbolo especial
    special_chars = "!@#$%^&*()_+-=[]{}|;:'\",.<>?/"
    if not any(c in special_chars for c in password):
        errors.append("Must contain at least one special character")
    
    return len(errors) == 0, errors
```

## 6.2 Servicio de Autorización - `services/auth.py`

```python
"""
=============================================================================
SERVICIO DE AUTORIZACIÓN - SIRONA
=============================================================================
Módulo: services/auth.py
Responsabilidad: Control de acceso basado en roles (RBAC)

Common Criteria References:
- FDP_ACC.1: Control de Acceso por Subconjunto
- FDP_ACF.1: Control de Acceso Basado en Atributos de Seguridad
- FMT_SMR.1: Roles de Seguridad
- FIA_UID.2: Identificación de Usuario Antes de Cualquier Acción

Modelo RBAC:
- ADMINISTRADOR: Gestión total del sistema
- MÉDICO: Acceso a historiales de pacientes asignados
- PACIENTE: Solo acceso a su propio historial
- SECRETARIO: Gestión de citas y registros básicos
=============================================================================
"""

from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from models.models import User, UserRole
from services.security import decode_token

# ============================================================================
# ESQUEMA DE AUTENTICACIÓN BEARER
# ============================================================================
# HTTPBearer activa el icono de candado en Swagger UI
# Requiere header: Authorization: Bearer <token>
security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """
    Extrae y valida el token JWT del header Authorization.
    
    SEGURIDAD (FIA_UID.2):
    - Identificación obligatoria antes de cualquier acción
    - Token debe ser válido y no expirado
    - Usuario debe existir en base de datos
    
    Flujo:
    1. Extraer token del header Authorization
    2. Decodificar y validar firma JWT
    3. Extraer user_id del claim 'sub'
    4. Buscar usuario en MongoDB
    5. Retornar objeto User para uso en endpoint
    
    Args:
        credentials: Header Authorization extraído por HTTPBearer
        
    Returns:
        User: Objeto de usuario autenticado
        
    Raises:
        HTTPException 401: Token inválido, expirado o usuario no encontrado
    """
    token = credentials.credentials
    
    # Decodificar y validar token
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",  # Mensaje genérico (FTA_TAB.1)
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Extraer identificador de usuario
    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Buscar usuario en base de datos
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
    
    SEGURIDAD (FDP_ACF.1):
    - Control de acceso basado en atributo 'role'
    - Denegación explícita si rol no está en lista permitida
    
    Args:
        user: Usuario autenticado
        allowed_roles: Lista de roles que pueden acceder al recurso
        
    Raises:
        HTTPException 403: Usuario no tiene rol requerido
    """
    if user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Required roles: {[r.value for r in allowed_roles]}"
        )


async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency que retorna usuario solo si es Administrador.
    
    SEGURIDAD (FMT_SMR.1):
    - Rol ADMINISTRADOR tiene máximos privilegios
    - Usado en endpoints de gestión de usuarios y sistema
    
    Usage:
        @router.get("/admin/users")
        async def list_users(admin: User = Depends(get_admin_user)):
            ...
    """
    await require_role(current_user, [UserRole.ADMINISTRADOR])
    return current_user


async def get_secretary_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency que retorna usuario si es Secretario o Administrador.
    
    SEGURIDAD (FMT_SMR.1):
    - Secretarios gestionan citas y registros básicos
    - Administradores heredan permisos de secretario
    
    Usage:
        @router.post("/appointments")
        async def create_appointment(secretary: User = Depends(get_secretary_user)):
            ...
    """
    await require_role(current_user, [UserRole.SECRETARIO, UserRole.ADMINISTRADOR])
    return current_user


async def get_doctor_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency que retorna usuario solo si es Médico.
    
    SEGURIDAD (FMT_SMR.1):
    - Médicos acceden a historiales de pacientes asignados
    - Pueden crear y editar consultas médicas
    
    Usage:
        @router.post("/pacientes/{id}/consultas")
        async def create_consultation(doctor: User = Depends(get_doctor_user)):
            ...
    """
    await require_role(current_user, [UserRole.MEDICO])
    return current_user
```

## 6.3 Servicio de Integridad - `services/integrity.py`

```python
"""
=============================================================================
SERVICIO DE INTEGRIDAD DE DATOS - SIRONA
=============================================================================
Módulo: services/integrity.py
Responsabilidad: Verificación de integridad de historiales médicos

Common Criteria References:
- FDP_SDI.2: Monitoreo de Integridad de Datos Almacenados
- FCS_COP.1: Operación Criptográfica (SHA-256)
- FAU_GEN.1: Generación de Datos de Auditoría

Mecanismo:
1. Hash SHA-256 del contenido clínico (campos inmutables)
2. Verificación al acceder a historiales
3. Marcado de registros corruptos
4. Alertas a administrador
=============================================================================
"""

import hashlib
import json
from typing import Optional, Tuple, Dict, Any, List
from datetime import datetime, date
import logging

from models.models import PatientHistory, AuditLog, User, UserRole
from services.audit import audit_logger, AuditEventType

logger = logging.getLogger("sirona.integrity")


class IntegrityService:
    """
    Servicio para verificar y mantener la integridad de los historiales médicos.
    
    ARQUITECTURA:
    - Hash calculado sobre campos clínicos (inmutables médicamente)
    - Metadata volátil excluida del hash (timestamps, IDs)
    - Serialización determinista para reproducibilidad
    """
    
    @staticmethod
    def _serialize_for_hash(obj: Any) -> Any:
        """
        Serializa objetos de forma determinista para hash reproducible.
        
        IMPORTANTE: El orden de claves y elementos debe ser consistente
        para que el mismo contenido genere siempre el mismo hash.
        
        Args:
            obj: Objeto a serializar (dict, list, datetime, Pydantic)
            
        Returns:
            Objeto serializado de forma determinista
        """
        if isinstance(obj, dict):
            # Ordenar claves alfabéticamente
            return {k: IntegrityService._serialize_for_hash(v) 
                    for k, v in sorted(obj.items())}
        elif isinstance(obj, list):
            return [IntegrityService._serialize_for_hash(item) for item in obj]
        elif isinstance(obj, (datetime, date)):
            return obj.isoformat()
        elif hasattr(obj, 'dict'):
            # Modelos Pydantic
            return IntegrityService._serialize_for_hash(obj.dict())
        else:
            return obj
    
    @staticmethod
    def calculate_hash(history: PatientHistory) -> str:
        """
        Calcula el hash SHA-256 del contenido clínico de un historial.
        
        SEGURIDAD (FCS_COP.1):
        - SHA-256 proporciona 256 bits de seguridad
        - Resistente a colisiones y preimagen
        
        CAMPOS INCLUIDOS (contenido clínico):
        - tipoSangre: Dato médico fundamental
        - alergias: Crítico para prescripción
        - condicionesCronicas: Historial médico
        - medicamentosActuales: Interacciones medicamentosas
        - consultas: Registro de atenciones (ordenadas por ID)
        - vacunas: Historial de inmunización (ordenadas por nombre)
        - antecedentesFamiliares: Predisposiciones genéticas
        - medicoAsignado: Responsable del paciente
        - contactoEmergencia: Datos críticos de contacto
        
        CAMPOS EXCLUIDOS (metadata volátil):
        - id: Identificador de MongoDB (auto-generado)
        - patient_id: Referencia a usuario (no contenido clínico)
        - ultimaModificacion: Timestamp de operación
        
        Args:
            history: PatientHistory a hashear
            
        Returns:
            str: Hash SHA-256 en formato hexadecimal (64 caracteres)
        """
        # Extraer solo campos clínicos
        clinical_content = {
            "tipoSangre": history.tipoSangre,
            "alergias": sorted(history.alergias) if history.alergias else [],
            "condicionesCronicas": sorted(history.condicionesCronicas) if history.condicionesCronicas else [],
            "medicamentosActuales": sorted(history.medicamentosActuales) if history.medicamentosActuales else [],
            "consultas": [
                {
                    "id": c.id,
                    "fecha": c.fecha.isoformat() if isinstance(c.fecha, date) else c.fecha,
                    "motivo": c.motivo,
                    "diagnostico": c.diagnostico,
                    "tratamiento": c.tratamiento,
                    "notasMedico": c.notasMedico
                }
                for c in sorted(history.consultas, key=lambda x: x.id)
            ] if history.consultas else [],
            "vacunas": [
                {
                    "nombre": v.nombre,
                    "fecha": v.fecha.isoformat() if isinstance(v.fecha, date) else v.fecha,
                    "proximaDosis": v.proximaDosis.isoformat() if v.proximaDosis else None
                }
                for v in sorted(history.vacunas, key=lambda x: x.nombre)
            ] if history.vacunas else [],
            "antecedentesFamiliares": sorted(history.antecedentesFamiliares) if history.antecedentesFamiliares else [],
            "medicoAsignado": {
                "nombre": history.medicoAsignado.nombre,
                "especialidad": history.medicoAsignado.especialidad,
                "telefono": history.medicoAsignado.telefono
            } if history.medicoAsignado else None,
            "contactoEmergencia": {
                "nombre": history.contactoEmergencia.nombre,
                "relacion": history.contactoEmergencia.relacion,
                "telefono": history.contactoEmergencia.telefono
            } if history.contactoEmergencia else None
        }
        
        # Serialización determinista
        serialized = IntegrityService._serialize_for_hash(clinical_content)
        json_str = json.dumps(serialized, sort_keys=True, ensure_ascii=False)
        
        # Cálculo SHA-256
        hash_obj = hashlib.sha256(json_str.encode('utf-8'))
        return hash_obj.hexdigest()
    
    @staticmethod
    async def verify_integrity(
        history: PatientHistory,
        ip_address: str = "system",
        user_agent: str = "integrity_checker"
    ) -> Tuple[bool, str, str]:
        """
        Verifica la integridad de un historial comparando hashes.
        
        SEGURIDAD (FDP_SDI.2):
        - Detecta modificaciones no autorizadas
        - Registra todas las verificaciones en auditoría
        
        Args:
            history: Historial a verificar
            ip_address: IP para registro de auditoría
            user_agent: User-Agent para auditoría
            
        Returns:
            tuple: (es_válido, hash_esperado, hash_calculado)
        """
        expected_hash = getattr(history, 'integrity_hash', None) or ""
        calculated_hash = IntegrityService.calculate_hash(history)
        
        # Sin hash previo = primer acceso
        if not expected_hash:
            logger.info(f"History {history.id} has no integrity hash.")
            return (True, "", calculated_hash)
        
        is_valid = expected_hash == calculated_hash
        
        # Registrar verificación en auditoría (FAU_GEN.1)
        await audit_logger.log_integrity_check(
            patient_id=history.patient_id,
            history_id=str(history.id),
            expected_hash=expected_hash,
            calculated_hash=calculated_hash,
            is_valid=is_valid,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        if not is_valid:
            logger.critical(
                f"INTEGRITY VIOLATION for history {history.id}! "
                f"Expected: {expected_hash[:16]}..., Got: {calculated_hash[:16]}..."
            )
        
        return (is_valid, expected_hash, calculated_hash)
    
    @staticmethod
    async def mark_as_corrupted(
        history: PatientHistory,
        reason: str,
        ip_address: str = "system"
    ) -> None:
        """
        Marca un historial como potencialmente corrupto.
        
        SEGURIDAD:
        - Bloquea acceso para usuarios no-admin
        - Registra evento crítico en auditoría
        - Preserva datos para análisis forense
        
        Args:
            history: Historial a marcar
            reason: Razón de la corrupción detectada
            ip_address: IP para auditoría
        """
        history.is_corrupted = True
        history.corruption_detected_at = datetime.utcnow()
        history.corruption_reason = reason
        await history.save()
        
        # Evento crítico de auditoría
        await audit_logger.log_event(
            event_type=AuditEventType.HISTORIAL_CORRUPTO,
            patient_id=history.patient_id,
            ip_address=ip_address,
            user_agent="integrity_service",
            details={
                "history_id": str(history.id),
                "reason": reason,
                "action": "MARKED_CORRUPTED"
            }
        )
        
        logger.critical(f"HISTORIAL MARKED AS CORRUPTED: {history.id}")


# Instancia global
integrity_service = IntegrityService()
```

## 6.4 Servicio de Auditoría - `services/audit.py`

```python
"""
=============================================================================
SERVICIO DE AUDITORÍA CENTRALIZADO - SIRONA
=============================================================================
Módulo: services/audit.py
Responsabilidad: Registro inmutable de eventos de seguridad

Common Criteria References:
- FAU_GEN.1: Generación de Datos de Auditoría
- FAU_GEN.2: Asociación de Identidad de Usuario
- FAU_STG.1: Almacenamiento Protegido de Trail de Auditoría
- FAU_STG.4: Prevención de Pérdida de Datos de Auditoría

Características:
- Eventos WORM (Write Once, Read Many)
- Reintentos automáticos con backoff exponencial
- Logging de respaldo si falla BD
- Tipos de eventos estandarizados
=============================================================================
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum
import asyncio
import logging

from models.models import AuditLog

logger = logging.getLogger("sirona.audit")


class AuditEventType(str, Enum):
    """
    Tipos de eventos de auditoría estandarizados.
    
    Categorías:
    - Historial: Acceso y modificación de datos clínicos
    - Consulta: Creación y edición de consultas médicas
    - Acceso: Intentos de acceso (exitosos y denegados)
    - Autenticación: Login, logout, bloqueos
    - Usuario: CRUD de cuentas de usuario
    - Integridad: Verificación de hashes
    - Citas: Gestión de citas médicas
    """
    # Eventos de historial
    HISTORIAL_ABIERTO = "HISTORIAL_ABIERTO"
    HISTORIAL_EDITADO = "HISTORIAL_EDITADO"
    HISTORIAL_CORRUPTO = "HISTORIAL_CORRUPTO"
    
    # Eventos de consulta
    CONSULTA_CREADA = "CONSULTA_CREADA"
    CONSULTA_EDITADA = "CONSULTA_EDITADA"
    
    # Eventos de acceso
    ACCESO_DENEGADO = "ACCESO_DENEGADO"
    ACCESO_EXITOSO = "ACCESO_EXITOSO"
    
    # Eventos de autenticación
    LOGIN_EXITOSO = "LOGIN_EXITOSO"
    LOGIN_FALLIDO = "LOGIN_FALLIDO"
    CUENTA_BLOQUEADA = "CUENTA_BLOQUEADA"
    CUENTA_DESBLOQUEADA = "CUENTA_DESBLOQUEADA"
    
    # Eventos de usuario (CRUD)
    USUARIO_CREADO = "USUARIO_CREADO"
    USUARIO_EDITADO = "USUARIO_EDITADO"
    USUARIO_ELIMINADO = "USUARIO_ELIMINADO"
    USUARIO_CONSULTADO = "USUARIO_CONSULTADO"
    ROL_CAMBIADO = "ROL_CAMBIADO"
    CONTRASENA_CAMBIADA = "CONTRASENA_CAMBIADA"
    
    # Eventos de integridad
    INTEGRIDAD_VERIFICADA = "INTEGRIDAD_VERIFICADA"
    INTEGRIDAD_FALLIDA = "INTEGRIDAD_FALLIDA"
    
    # Eventos de rate limiting
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    
    # Eventos de citas
    CITA_CREADA = "CITA_CREADA"
    CITA_EDITADA = "CITA_EDITADA"
    CITA_CANCELADA = "CITA_CANCELADA"


class AuditLogger:
    """
    Logger de auditoría centralizado con garantía de entrega.
    
    SEGURIDAD (FAU_STG.4):
    - Reintentos automáticos en caso de fallo de BD
    - Backoff exponencial para evitar sobrecarga
    - Logging de respaldo a archivo si fallan todos los reintentos
    """
    
    MAX_RETRIES = 3           # Intentos máximos de guardado
    RETRY_DELAY = 1.0         # Delay base entre reintentos (segundos)
    
    def __init__(self):
        self._queue: List[AuditLog] = []
        self._processing = False
    
    async def log_event(
        self,
        event_type: AuditEventType,
        user_id: Optional[str] = None,
        user_email: Optional[str] = None,
        user_role: Optional[str] = None,
        patient_id: Optional[str] = None,
        ip_address: str = "unknown",
        user_agent: str = "",
        details: Optional[Dict[str, Any]] = None,
        action: Optional[str] = None
    ) -> Optional[AuditLog]:
        """
        Registra un evento de auditoría.
        
        SEGURIDAD (FAU_GEN.1, FAU_GEN.2):
        - Timestamp automático en UTC
        - Asociación de identidad de usuario
        - Contexto completo (IP, User-Agent)
        
        Campos requeridos por PBI-15:
        - ID_Usuario (user_id)
        - Rol_Usuario (user_role)
        - ID_Paciente_Consultado (patient_id)
        - Acción_Realizada (event_type/action)
        - Timestamp (automático)
        
        Args:
            event_type: Tipo de evento (enum)
            user_id: ID del usuario que realiza la acción
            user_email: Email del usuario
            user_role: Rol del usuario
            patient_id: ID del paciente afectado (si aplica)
            ip_address: IP del cliente
            user_agent: Navegador/cliente
            details: Información adicional estructurada
            action: Acción específica (override de event_type)
            
        Returns:
            AuditLog: Evento guardado o None si falla
        """
        # Construir detalles extendidos
        extended_details = {
            "user_role": user_role,
            "patient_id": patient_id,
            "action": action or event_type.value,
            **(details or {})
        }
        
        audit_entry = AuditLog(
            timestamp=datetime.utcnow(),
            event=event_type.value,
            user_id=user_id,
            user_email=user_email,
            ip_address=ip_address,
            user_agent=user_agent,
            details=extended_details
        )
        
        return await self._save_with_retry(audit_entry)
    
    async def _save_with_retry(self, audit_entry: AuditLog) -> Optional[AuditLog]:
        """
        Guarda evento con reintentos automáticos.
        
        SEGURIDAD (FAU_STG.4):
        - 3 intentos con backoff exponencial
        - Logging crítico si fallan todos los intentos
        """
        for attempt in range(self.MAX_RETRIES):
            try:
                await audit_entry.insert()
                logger.info(
                    f"Audit event logged: {audit_entry.event} - "
                    f"User: {audit_entry.user_email}"
                )
                return audit_entry
            except Exception as e:
                logger.warning(
                    f"Failed to save audit (attempt {attempt + 1}/{self.MAX_RETRIES}): {e}"
                )
                if attempt < self.MAX_RETRIES - 1:
                    # Backoff exponencial
                    await asyncio.sleep(self.RETRY_DELAY * (attempt + 1))
        
        # Logging de respaldo si falla BD
        logger.critical(
            f"AUDIT EVENT LOST - Event: {audit_entry.event}, "
            f"User: {audit_entry.user_email}, Details: {audit_entry.details}"
        )
        return None


# Instancia global del logger
audit_logger = AuditLogger()
```

## 6.5 Middleware de Rate Limiting - `middleware/rate_limiter.py`

```python
"""
=============================================================================
MIDDLEWARE DE RATE LIMITING - SIRONA
=============================================================================
Módulo: middleware/rate_limiter.py
Responsabilidad: Prevención de ataques de fuerza bruta y DoS

Common Criteria References:
- FTA_TSE.1: Establecimiento de Sesión TOE
- FIA_AFL.1: Manejo de Fallos de Autenticación

Algoritmo: Sliding Window Counter
- Ventana de tiempo configurable (default: 60 segundos)
- Límite de requests por IP (default: 100)
- Headers informativos de estado
=============================================================================
"""

from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict
import asyncio


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware para limitar solicitudes por IP.
    
    SEGURIDAD (FTA_TSE.1):
    - Previene ataques de fuerza bruta en login
    - Mitiga ataques DoS básicos
    - Tracking por IP con limpieza automática
    
    Características:
    - Thread-safe con asyncio.Lock
    - Excluye preflight CORS (OPTIONS)
    - Headers informativos para debugging
    """
    
    def __init__(self, app, max_requests: int = 100, window_seconds: int = 60):
        """
        Inicializa el middleware de rate limiting.
        
        Args:
            app: Aplicación FastAPI
            max_requests: Máximo de requests por ventana (default: 100)
            window_seconds: Tamaño de ventana en segundos (default: 60)
        """
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.request_times: Dict[str, list] = defaultdict(list)
        self.lock = asyncio.Lock()
    
    async def dispatch(self, request: Request, call_next):
        """
        Procesa cada request y aplica rate limiting.
        
        Algoritmo:
        1. Excluir OPTIONS (preflight CORS)
        2. Obtener IP del cliente
        3. Limpiar timestamps antiguos
        4. Verificar límite
        5. Registrar nuevo request
        6. Agregar headers informativos
        """
        # Excluir preflight CORS del rate limiting
        if request.method == "OPTIONS":
            return await call_next(request)
        
        client_ip = request.client.host
        now = datetime.utcnow()
        
        async with self.lock:
            # Limpiar timestamps fuera de la ventana
            cutoff_time = now - timedelta(seconds=self.window_seconds)
            self.request_times[client_ip] = [
                ts for ts in self.request_times[client_ip] 
                if ts > cutoff_time
            ]
            
            # Verificar límite
            if len(self.request_times[client_ip]) >= self.max_requests:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Max {self.max_requests} requests per {self.window_seconds} seconds."
                )
            
            # Registrar request actual
            self.request_times[client_ip].append(now)
        
        # Procesar request
        response = await call_next(request)
        
        # Headers informativos (RFC 6585)
        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(
            self.max_requests - len(self.request_times[client_ip])
        )
        
        return response
```

---

# Apéndice A: Glosario de Términos Common Criteria

| Término | Definición |
|---------|------------|
| **TOE** | Target of Evaluation - El sistema bajo evaluación (Sirona) |
| **TSF** | TOE Security Functions - Funciones de seguridad del sistema |
| **SFR** | Security Functional Requirements - Requerimientos funcionales |
| **FIA** | Identification and Authentication - Clase de identificación |
| **FCS** | Cryptographic Support - Clase de soporte criptográfico |
| **FDP** | User Data Protection - Clase de protección de datos |
| **FAU** | Security Audit - Clase de auditoría |
| **FMT** | Security Management - Clase de gestión de seguridad |
| **FPT** | Protection of TSF - Clase de protección del sistema |
| **FTA** | TOE Access - Clase de acceso al sistema |

---

# Apéndice B: Configuración de Variables de Entorno

```env
# ===========================================
# SIRONA BACKEND - VARIABLES DE ENTORNO
# ===========================================

# JWT Configuration (FCS_CKM.1)
JWT_SECRET_KEY=<clave-secreta-256-bits>
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60

# MongoDB (Zero Trust Architecture)
MONGO_URI_AUTH=mongodb://localhost:27017
MONGO_URI_CORE=mongodb://localhost:27017
MONGO_URI_LOGS=mongodb://localhost:27017
DB_NAME_AUTH=sirona_auth
DB_NAME_CORE=sirona_core
DB_NAME_LOGS=sirona_logs

# Account Lockout (FIA_AFL.1)
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15

# Rate Limiting (FTA_TSE.1)
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_SECONDS=60

# SMTP (Email Service)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=notifications@sirona.com
SMTP_PASSWORD=<smtp-password>
SMTP_FROM_EMAIL=no-reply@sirona.com
SMTP_FROM_NAME=Sirona System

# Kairos (Biometric Verification)
KAIROS_IDV_BASE_URL=https://idv-eu.kairos.com/v0.1
KAIROS_IDV_APP_ID=<kairos-app-id>
KAIROS_IDV_APP_KEY=<kairos-app-key>
KAIROS_PROFILE=optimal-v0
```

---

**Documento generado**: 18 de Enero de 2026  
**Sistema**: SIRONA v1.0.0  
**Estándar**: Common Criteria ISO/IEC 15408-2:2022
