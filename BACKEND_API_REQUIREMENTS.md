# API Endpoints - Backend Requirements

Documentación de endpoints necesarios para el backend de Sirona basado en las funcionalidades implementadas en el frontend.

---

## 📋 Índice

1. [Autenticación](#autenticación)
2. [Gestión de Contraseñas](#gestión-de-contraseñas)
3. [Administración de Usuarios](#administración-de-usuarios)
4. [Seguridad](#seguridad)

---

## � Historiales Clínicos

### GET `/api/paciente/mi-historial`

Obtener el historial clínico personal del paciente autenticado (solo lectura).

**Headers:**
```
Authorization: Bearer <patient-token>
```

**Response Success (200):**
```json
{
  "id": "hist_001",
  "fecha": "2026-01-08",
  "diagnostico": "Hipertensión arterial leve",
  "sintomas": "Dolores de cabeza ocasionales, mareos leves",
  "tratamiento": "Modificación del estilo de vida, medicación antihipertensiva",
  "medicamentos": "Losartán 50mg una vez al día",
  "notas": "Paciente responde bien al tratamiento. Se recomienda reducir consumo de sal y realizar ejercicio regular.",
  "proximaCita": "2026-02-08",
  "ultimaModificacion": "2026-01-08T14:30:00Z"
}
```

**Response Unauthorized (401):**
```json
{
  "error": "Unauthorized. Please login again."
}
```

**Response Forbidden (403):**
```json
{
  "error": "Access denied. This action is not permitted."
}
```

**Response Not Found (404):**
```json
{
  "error": "Medical history not found"
}
```

**Lógica Requerida:**
- Verificar autenticación (token válido)
- Verificar que el usuario sea Paciente
- Devolver solo el historial del usuario autenticado (no de otros)
- Los datos deben ser de **solo lectura** (el paciente no puede editarlos)
- Si el usuario no es Paciente, devolver 403
- Si no hay historial, devolver 404

---



### POST `/api/auth/login`

Autenticación con correo y contraseña, incluyendo detección de bloqueo de cuenta.

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@sirona.local",
  "password": "SecurePass123!"
}
```

**Response Success (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "Médico",
  "requires_mfa": false
}
```

**Response MFA Required (200):**
```json
{
  "requires_mfa": true,
  "message": "Please verify with MFA"
}
```

**Response Account Locked (403):**
```json
{
  "account_locked": true,
  "locked_until": "2026-01-01T12:15:30Z",
  "message": "Account locked due to too many failed login attempts"
}
```

**Response Invalid Credentials (401):**
```json
{
  "error": "Invalid credentials"
}
```

**Lógica Requerida:**
- Contar intentos fallidos consecutivos por cuenta
- Bloquear cuenta tras 5 intentos fallidos
- Bloqueo de 15 minutos
- Reiniciar contador tras login exitoso
- Rate limiting: 5 requests/minuto por IP
- Hash de contraseñas con Argon2 o bcrypt

---

### POST `/api/auth/login/face`

Autenticación con reconocimiento facial y prueba de vida.

**Headers:**
```
Content-Type: multipart/form-data
```

**Request Body (FormData):**
```
email: "user@sirona.local"
face_image: <File>
```

**Response Success (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "Médico",
  "requires_mfa": true
}
```

**Response Account Locked (403):**
```json
{
  "account_locked": true,
  "locked_until": "2026-01-01T12:15:30Z",
  "message": "Account locked"
}
```

**Lógica Requerida:**
- Validar prueba de vida (liveness detection)
- Comparar con plantilla biométrica almacenada
- Aplicar misma lógica de bloqueo que login con contraseña
- Incrementar contador de intentos fallidos si no coincide

---

### POST `/api/auth/otp/verify`

Verificación de código OTP para MFA.

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@sirona.local",
  "otp": "123456"
}
```

**Response Success (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "Médico"
}
```

**Response Invalid OTP (401):**
```json
{
  "error": "Invalid OTP code"
}
```

**Lógica Requerida:**
- Validar código OTP de 6 dígitos
- Expiración de OTP tras 5 minutos
- Máximo 3 intentos antes de requerir nuevo código
- Siempre requerir MFA para administradores

---

### POST `/api/auth/register`

Registro de nuevos usuarios con validación de contraseña segura.

**Headers:**
```
Content-Type: multipart/form-data
```

**Request Body (FormData):**
```
fullName: "Juan Pérez"
email: "juan@correo.com"
cedula: "1234567890"
password: "SecurePass123!@"
cedulaImage: <File>
```

**Response Success (201):**
```json
{
  "message": "User registered successfully",
  "user_id": "uuid-v4-string"
}
```

**Response Invalid Password (400):**
```json
{
  "error": "Password does not meet requirements",
  "details": [
    "Must be at least 12 characters",
    "Must contain at least one uppercase letter"
  ]
}
```

**Validaciones de Contraseña Requeridas:**
- ✅ Mínimo 12 caracteres
- ✅ Al menos una letra mayúscula
- ✅ Al menos una letra minúscula
- ✅ Al menos un número
- ✅ Al menos un símbolo especial (`!@#$%^&*()_+-=[]{}|;:'",.<>?/`)

**Lógica Requerida:**
- Hash de contraseña con Argon2 o bcrypt + salt
- Validar imagen de cédula (OCR opcional)
- Enviar email de verificación (opcional)
- Asignar rol "Paciente" por defecto

---

## 🔑 Gestión de Contraseñas

### POST `/api/auth/change-password`

Cambio de contraseña para usuarios autenticados.

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass456!@"
}
```

**Response Success (200):**
```json
{
  "message": "Password changed successfully"
}
```

**Response Invalid Current Password (401):**
```json
{
  "error": "Current password is incorrect"
}
```

**Response Weak Password (400):**
```json
{
  "error": "New password does not meet requirements",
  "details": [
    "Must be at least 12 characters",
    "Must contain at least one special character"
  ]
}
```

**Validaciones Requeridas:**
- Mismo requisitos que registro (12+ caracteres, mayúscula, minúscula, número, símbolo)
- Verificar contraseña actual antes de cambiar
- No permitir contraseñas recientes (últimas 3)
- Hash con Argon2 o bcrypt + salt

---

## 👥 Administración de Usuarios

### GET `/api/admin/users`

Listar todos los usuarios del sistema (solo administradores).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Query Parameters:**
```
page: number (opcional, default: 1)
limit: number (opcional, default: 50)
role: string (opcional, filtrar por rol)
status: string (opcional, filtrar por estado)
```

**Response Success (200):**
```json
{
  "users": [
    {
      "id": "uuid-v4-1",
      "fullName": "Juan Pérez",
      "email": "juan@sirona.local",
      "role": "Médico",
      "status": "Activo",
      "createdAt": "2025-12-01T10:00:00Z",
      "lastLogin": "2026-01-01T08:30:00Z"
    },
    {
      "id": "uuid-v4-2",
      "fullName": "María González",
      "email": "maria@sirona.local",
      "role": "Paciente",
      "status": "Activo",
      "createdAt": "2025-11-15T14:20:00Z",
      "lastLogin": "2025-12-30T16:45:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

**Response Forbidden (403):**
```json
{
  "error": "Access denied. Administrator role required."
}
```

**Lógica Requerida:**
- Verificar que el usuario autenticado tenga rol "Administrador"
- Implementar paginación
- Incluir filtros opcionales por rol y estado
- No exponer información sensible (contraseñas, tokens)

---

### PATCH `/api/admin/users/{userId}/role`

Cambiar el rol de un usuario (solo administradores).

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <admin-token>
```

**Path Parameters:**
```
userId: string (UUID del usuario)
```

**Request Body:**
```json
{
  "role": "Médico"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid-v4-1",
    "fullName": "Juan Pérez",
    "email": "juan@sirona.local",
    "role": "Médico",
    "status": "Activo",
    "updatedAt": "2026-01-01T10:30:00Z"
  }
}
```

**Response Invalid Role (400):**
```json
{
  "error": "Invalid role. Allowed values: Administrador, Médico, Paciente, Secretario"
}
```

**Response User Not Found (404):**
```json
{
  "error": "User not found"
}
```

**Response Forbidden (403):**
```json
{
  "error": "Access denied. Administrator role required."
}
```

**Roles Permitidos:**
- `Administrador`
- `Médico`
- `Paciente`
- `Secretario`

**Lógica Requerida:**
- Verificar que el usuario autenticado sea administrador
- Validar que el rol sea uno de los 4 permitidos
- Registrar cambio en logs de auditoría
- Notificar al usuario del cambio de rol (email)
- Invalidar tokens antiguos si es necesario

---

## 🔒 Seguridad

### Rate Limiting

**Endpoints a Proteger:**
- `POST /api/auth/login` - 5 requests/minuto por IP
- `POST /api/auth/login/face` - 5 requests/minuto por IP
- `POST /api/auth/otp/verify` - 3 requests/minuto por email
- `POST /api/auth/register` - 3 requests/minuto por IP

**Response Rate Limit Exceeded (429):**
```json
{
  "error": "Too many requests. Please try again later.",
  "retry_after": 60
}
```

---

### Bloqueo de Cuenta

**Lógica de Intentos Fallidos:**

1. **Contador de intentos:** 
   - Incrementar en cada login fallido
   - Almacenar en BD o Redis

2. **Bloqueo al 5to intento:**
   - Guardar timestamp de bloqueo
   - Duración: 15 minutos

3. **Desbloqueo automático:**
   - Verificar `locked_until` en cada intento de login
   - Si `now > locked_until`, desbloquear y reiniciar contador

4. **Reinicio de contador:**
   - En login exitoso
   - Tras desbloqueo automático

---

### Hash de Contraseñas

**Algoritmo Recomendado:** Argon2id

**Alternativa:** bcrypt (factor de trabajo mínimo: 12)

**Ejemplo con Argon2:**
```python
from argon2 import PasswordHasher

ph = PasswordHasher()
hash = ph.hash("password123")
# Verificar
ph.verify(hash, "password123")
```

---

### Tokens JWT

**Estructura del Token:**
```json
{
  "sub": "user-uuid",
  "email": "user@sirona.local",
  "role": "Médico",
  "exp": 1735833600,
  "iat": 1735747200
}
```

**Configuración:**
- Algoritmo: HS256 o RS256
- Expiración: 1 hora
- Refresh tokens: 7 días (opcional)
- Secret key: Almacenar en variable de entorno

---

## 📊 Logs de Auditoría

Registrar en logs de auditoría (BD WORM):

- ✅ Todos los intentos de login (exitosos y fallidos)
- ✅ Bloqueos de cuenta
- ✅ Cambios de contraseña
- ✅ Cambios de rol (quién, a quién, cuándo)
- ✅ Accesos a gestión de usuarios
- ✅ Intentos de acceso no autorizado

**Estructura de Log:**
```json
{
  "timestamp": "2026-01-01T10:30:00Z",
  "event": "login_failed",
  "user_email": "user@sirona.local",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "details": {
    "attempts_count": 3
  }
}
```

---

## 🧪 Testing

**Casos de Prueba Críticos:**

1. **Bloqueo de cuenta:**
   - 5 intentos fallidos → bloqueo
   - Intentar login durante bloqueo → error 403
   - Esperar 15 min → desbloqueo automático
   - Login exitoso → reinicio de contador

2. **Validación de contraseña:**
   - Todas las combinaciones de requisitos
   - Rechazo si falta algún requisito

3. **Cambio de rol:**
   - Solo admins pueden cambiar roles
   - Usuario no-admin recibe 403
   - Roles válidos son aceptados
   - Roles inválidos reciben 400

4. **Rate limiting:**
   - 6to request en 1 minuto → 429
   - Esperar 1 minuto → permitir nuevos requests

---

## 🚀 Prioridades de Implementación

### Alta Prioridad
1. ✅ POST `/api/auth/login` (con bloqueo de cuenta)
2. ✅ POST `/api/auth/register` (con validación de contraseña)
3. ✅ POST `/api/auth/change-password`
4. ✅ GET `/api/paciente/mi-historial` (PBI-13: Historial de Paciente)
5. ✅ Rate limiting en endpoints de auth

### Media Prioridad
6. ✅ GET `/api/admin/users`
7. ✅ PATCH `/api/admin/users/{userId}/role`
8. ✅ POST `/api/auth/otp/verify`

### Baja Prioridad
9. POST `/api/auth/login/face`
10. Logs de auditoría detallados
11. Notificaciones por email

---

## 📝 Notas Adicionales

- **TLS 1.3:** Todos los endpoints deben usar HTTPS en producción
- **CORS:** Configurar origins permitidos
- **Headers de Seguridad:** 
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security: max-age=31536000`
- **Validación de Entrada:** Sanitizar todos los inputs
- **Errores Genéricos:** No revelar si un email existe o no en errores de login

---

## � User Data Models - Mock Data

Estructura de datos para usuarios según su rol. Estos ejemplos muestran cómo debe devolverse la información de usuarios en los endpoints de perfil y gestión.

### Administrador

```json
{
  "id": "admin-uuid-001",
  "fullName": "Carlos Alberto Rodríguez",
  "email": "carlos.rodriguez@sirona.local",
  "role": "Administrador",
  "status": "Activo",
  "cedula": "1234567890",
  "createdAt": "2025-01-15T08:00:00Z",
  "lastLogin": "2026-01-09T14:30:00Z",
  "memberSince": "Enero 2025",
  "permissions": [
    "manage_users",
    "manage_roles",
    "view_logs",
    "manage_settings"
  ]
}
```

### Médico

```json
{
  "id": "doctor-uuid-001",
  "fullName": "Roberto García López",
  "email": "roberto.garcia@sirona.local",
  "role": "Médico",
  "status": "Activo",
  "cedula": "9876543210",
  "especialidad": "Cardiología",
  "numeroLicencia": "LIC-2024-45678",
  "createdAt": "2024-06-20T10:15:00Z",
  "lastLogin": "2026-01-09T11:45:00Z",
  "memberSince": "Junio 2024",
  "permissions": [
    "view_patients",
    "create_medical_records",
    "edit_own_records",
    "prescribe_medication"
  ]
}
```

### Paciente

```json
{
  "id": "patient-uuid-001",
  "fullName": "María José Martínez",
  "email": "maria.martinez@email.com",
  "role": "Paciente",
  "status": "Activo",
  "cedula": "5555666777",
  "fechaNacimiento": "1985-03-15",
  "telefonoContacto": "+34 612 345 678",
  "createdAt": "2025-08-10T09:20:00Z",
  "lastLogin": "2026-01-08T16:00:00Z",
  "memberSince": "Agosto 2025",
  "permissions": [
    "view_own_records",
    "view_appointments",
    "message_doctor"
  ]
}
```

### Secretario

```json
{
  "id": "secretary-uuid-001",
  "fullName": "Ana Isabel Sánchez",
  "email": "ana.sanchez@sirona.local",
  "role": "Secretario",
  "status": "Activo",
  "cedula": "3333444555",
  "departamento": "Admisión",
  "createdAt": "2024-11-01T13:30:00Z",
  "lastLogin": "2026-01-09T08:45:00Z",
  "memberSince": "Noviembre 2024",
  "permissions": [
    "manage_appointments",
    "view_patient_list",
    "create_patient_records",
    "generate_reports"
  ]
}
```

### Estructura de Respuesta para GET `/api/admin/users` (Completa)

```json
{
  "users": [
    {
      "id": "admin-uuid-001",
      "fullName": "Carlos Alberto Rodríguez",
      "email": "carlos.rodriguez@sirona.local",
      "role": "Administrador",
      "status": "Activo",
      "createdAt": "2025-01-15T08:00:00Z",
      "lastLogin": "2026-01-09T14:30:00Z"
    },
    {
      "id": "doctor-uuid-001",
      "fullName": "Roberto García López",
      "email": "roberto.garcia@sirona.local",
      "role": "Médico",
      "status": "Activo",
      "createdAt": "2024-06-20T10:15:00Z",
      "lastLogin": "2026-01-09T11:45:00Z"
    },
    {
      "id": "secretary-uuid-001",
      "fullName": "Ana Isabel Sánchez",
      "email": "ana.sanchez@sirona.local",
      "role": "Secretario",
      "status": "Activo",
      "createdAt": "2024-11-01T13:30:00Z",
      "lastLogin": "2026-01-09T08:45:00Z"
    },
    {
      "id": "patient-uuid-001",
      "fullName": "María José Martínez",
      "email": "maria.martinez@email.com",
      "role": "Paciente",
      "status": "Activo",
      "createdAt": "2025-08-10T09:20:00Z",
      "lastLogin": "2026-01-08T16:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 4,
    "totalPages": 1
  }
}
```

---

## 🔗 Frontend Integrado

El frontend ya está listo para consumir estos endpoints. Los archivos clave son:

- `LoginPage.tsx` - Login con contraseña y facial
- `RegisterForm.tsx` - Registro con validación
- `ChangePasswordForm.tsx` - Cambio de contraseña
- `UserManagementPage.tsx` - Gestión de usuarios (admin)
- `PatientHistoryPage.tsx` - Historial clínico solo lectura para pacientes (PBI-13)
- `authErrors.ts` - Utilidades para manejar errores
- `ProfilePage.tsx` - Perfil de usuario con secciones General y Seguridad
- `GeneralSection.tsx` - Mostración de datos del usuario
- `SecuritySection.tsx` - Cambio de contraseña

Simplemente descomenta las líneas `// TODO: integrar con FastAPI` en cada componente y reemplaza con las llamadas reales a la API.

### PatientHistoryPage - Manejo de Errores

El componente `PatientHistoryPage.tsx` implementa el siguiente manejo de errores:

**Código 401 (Unauthorized):**
- Muestra: "Sesión Expirada"
- Acción: Redirige automáticamente a `/login` después de 2 segundos

**Código 403 (Forbidden):**
- Muestra: "Acceso Denegado - No tienes permisos para acceder a esta información"
- Acción: Permite volver al inicio manualmente

**Otros errores (500, etc.):**
- Muestra: El mensaje de error genérico
- Acción: Permite volver al inicio manualmente


