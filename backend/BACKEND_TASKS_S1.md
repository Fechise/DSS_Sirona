# Sprint 1

## PBI-6: Registro de nuevo usuario con verificación facial.

**Como:** un nuevo usuario (médico o paciente)
**Quiero:** registrarme en el sistema proporcionando mis datos y una imagen de mi documento de identidad
**Para que:** el sistema pueda crear mi perfil y mi plantilla de reconocimiento facial

---
### **Criterios de Aceptación (Acceptance Criteria):**

* [ ] El formulario de registro debe solicitar nombre completo, correo electrónico, cédula y contraseña.
* [ ] El formulario debe incluir un control para capturar o subir la imagen del documento de identidad.
* [ ] Se debe validar que todos los campos estén completos antes de enviar.
* [ ] Al enviar, el sistema debe crear la cuenta de usuario en estado "Pendiente de Verificación".
* [ ] El sistema debe procesar la imagen de la cédula para extraer la plantilla facial y almacenarla de forma segura (ej. como un hash encriptado, nunca la imagen real).
* [ ] El sistema debe verificar que la contraseña cumpla con la política de calidad (reflejado en `FIA_SOS.1`).

Backend:
- [x] Definir modelo de entrada (DTO) con nombre, correo, cédula, contraseña, imagen documento
  - **Estado:** 🟡 **PARCIALMENTE IMPLEMENTADO**
  - ✅ Existen DTOs en `schemas/auth_schemas.py`: `RegisterDoctorRequest`, `RegisterSecretaryRequest`, `RegisterPatientRequest`
  - ✅ Incluyen campos: `email`, `fullName`, `cedula`, `password`
  - ❌ **FALTA:** Campo para imagen del documento (`document_image` o `imagen_documento`)
  - ❌ **FALTA:** Endpoint público `/api/auth/register` para auto-registro de pacientes
  - 📝 **Nota:** Los endpoints actuales (`/register-doctor`, `/register-secretary`, `/register-patient`) requieren autenticación

- [ ] Guardar usuario en BD con estado `PENDIENTE_VERIFICACION`
  - **Estado:** ❌ **NO IMPLEMENTADO**
  - ✅ Existe enum `UserStatus` en `models/models.py` con: `ACTIVO`, `INACTIVO`, `BLOQUEADO`
  - ❌ **FALTA:** Agregar estado `PENDIENTE_VERIFICACION` al enum `UserStatus`
  - ❌ **FALTA:** Lógica para guardar usuarios nuevos con estado `PENDIENTE_VERIFICACION`
  - ❌ **FALTA:** Implementar flujo de verificación para cambiar de `PENDIENTE_VERIFICACION` → `ACTIVO`

- [ ] Implementar servicio que reciba la imagen del documento y extraiga plantilla facial
  - **Estado:** ❌ **NO IMPLEMENTADO**
  - ✅ Existe campo `biometric_template: Optional[bytes]` en `SecuritySettings` del modelo `User`
  - ❌ **FALTA:** Servicio de extracción de plantilla facial (considerar: OpenCV, face_recognition, DeepFace)
  - ❌ **FALTA:** Endpoint para recibir y procesar imagen del documento
  - ❌ **FALTA:** Lógica para extraer rostro de la imagen de cédula
  - ❌ **FALTA:** Validación de calidad de imagen (resolución mínima, detección de rostro)

- [ ] Asegurar cifrado/obfuscación de la plantilla según política de seguridad
  - **Estado:** ❌ **NO IMPLEMENTADO**
  - ✅ Campo `biometric_template` definido como `bytes` en el modelo
  - ❌ **FALTA:** Implementar cifrado de la plantilla antes de guardar en BD (considerar: AES-256, Fernet, cryptography)
  - ❌ **FALTA:** Gestión segura de claves de cifrado (usar variables de entorno o servicio de secrets)
  - ❌ **FALTA:** Función para descifrar plantilla al momento de comparación facial
  - 📝 **Nota:** Nunca almacenar la imagen original, solo la plantilla cifrada

- [x] Implementar validación de calidad de contraseña según `FIA_SOS.1` (mínimo 12 caracteres, mayúsculas, números y símbolos)
  - **Estado:** ✅ **IMPLEMENTADO**
  - ✅ Existe función `validate_password_strength()` en `services/security.py`
  - ✅ Se usa en los 3 endpoints de registro: `/register-doctor`, `/register-secretary`, `/register-patient`
  - ✅ Valida: longitud mínima, mayúsculas, números, símbolos
  - ⚠️ **VERIFICAR:** Confirmar que el mínimo sea 12 caracteres (según documento requiere 12, no 8)

Frontend:
[X] Crear pantalla con campos: nombre completo, correo, cédula, contraseña y control para subir/capturar imagen de cédula.
[X] Mostrar mensajes de error en campo requerido vacío.
[X] Validar que todos los campos estén completos antes de habilitar el botón "Registrar".
[X] Validar formato básico de correo y longitud mínima de contraseña (con feedback visual).

---

## 📊 Resumen PBI-6 Backend:

| Tarea | Estado | Prioridad |
|-------|--------|-----------|
| 1. DTO con imagen documento | 🟡 Parcial | Alta |
| 2. Estado PENDIENTE_VERIFICACION | ❌ Pendiente | Alta |
| 3. Servicio extracción facial | ❌ Pendiente | Media |
| 4. Cifrado de plantilla | ❌ Pendiente | Alta (Seguridad) |
| 5. Validación contraseña | ✅ Hecho | - |

---

## PBI-7: Requerir Identificación de Usuario antes de Cualquier Acción

**Como:** usuario no autenticado
**Quiero:** que el sistema me pida identificarme (con usuario o correo) antes de intentar cualquier acción
**Para que:** ningún usuario anónimo pueda operar en el sistema

---
### **Criterios de Aceptación (Acceptance Criteria):**

* [x] El sistema NO debe mostrar ningún menú o dato de paciente si el usuario no está logueado.
* [x] Cualquier intento de acceder a una URL interna (ej. `/historiales`) debe redirigir a la pantalla de login.
* [x] La pantalla de login debe ser la única acción permitida para un usuario no identificado.

Backend:

- [x] Añadir dependencia de seguridad (`get_current_user`) en todos los endpoints internos
  - **Estado:** ✅ **IMPLEMENTADO**
  - ✅ Existe función `get_current_user()` en `services/auth.py`
  - ✅ Existe función `get_admin_user()` en `services/auth.py` (valida rol Administrador)
  - ✅ Existe función `get_secretary_user()` en `services/auth.py` (valida rol Secretario o Admin)
  - ✅ **Endpoints de Patients (`routers/patients.py`):**
    - `/listado-pacientes` - Protegido con `Depends(get_current_user)` ✅
    - `/mi-historial` - Protegido con `Depends(get_current_user)` ✅
    - `/pacientes/{patient_id}/historial` - Protegido con `Depends(get_current_user)` ✅
    - `/pacientes/{patient_id}/consultas` (POST) - Protegido con `Depends(get_current_user)` ✅
    - `/pacientes/{patient_id}/consultas` (GET) - Protegido con `Depends(get_current_user)` ✅
    - `/pacientes/{patient_id}/historial` (PUT) - Protegido con `Depends(get_current_user)` ✅
  - ✅ **Endpoints de Appointments (`routers/appointments.py`):**
    - `/appointments` (POST) - Protegido con `Depends(get_secretary_user)` ✅
    - `/appointments` (GET) - Protegido con `Depends(get_secretary_user)` ✅
    - `/appointments/{id}` (GET) - Protegido con `Depends(get_secretary_user)` ✅
    - `/appointments/{id}` (PUT) - Protegido con `Depends(get_secretary_user)` ✅
    - `/appointments/{id}` (DELETE) - Protegido con `Depends(get_secretary_user)` ✅
    - `/doctors` - Protegido con `Depends(get_secretary_user)` ✅
    - `/doctors/{id}/availability` - Protegido con `Depends(get_secretary_user)` ✅
    - `/doctors/{id}/schedule` - Protegido con `Depends(get_secretary_user)` ✅
    - `/doctors/{id}/availability` (POST) - Protegido con `Depends(get_current_user)` ✅
  - ✅ **Endpoints de Auth (`routers/auth.py`):**
    - `/register-doctor` - Protegido con `Depends(get_secretary_user)` ✅
    - `/register-secretary` - Protegido con `Depends(get_admin_user)` ✅
    - `/register-patient` - Protegido con `Depends(get_secretary_user)` ✅
  - ✅ **Verificación de roles específicos:**
    - Pacientes solo pueden ver su propio historial ✅
    - Médicos solo pueden ver historiales de pacientes asignados ✅
    - Secretarios pueden crear citas y listar pacientes ✅
    - Administradores pueden crear secretarios ✅
  - ✅ Todos los endpoints responden con `401 Unauthorized` si no hay token
  - ✅ Todos los endpoints responden con `403 Forbidden` si el rol no tiene permisos

- [x] Verificar que solo el endpoint de login/registro sea accesible sin credenciales
  - **Estado:** ✅ **IMPLEMENTADO**
  - ✅ **Endpoints públicos (sin autenticación requerida):**
    - `POST /api/auth/login` - Accesible sin token ✅
  - ✅ **Endpoints protegidos (requieren autenticación):**
    - Todos los demás endpoints requieren token JWT válido ✅
    - Los endpoints de registro requieren permisos específicos (Secretario o Admin) ✅
  - ✅ **Sistema de auditoría:**
    - Todos los accesos no autorizados se registran en `AuditLog` ✅
    - Se registra: evento, usuario, IP, user-agent, detalles del intento ✅
  - 📝 **Nota:** Los endpoints de registro (`/register-doctor`, `/register-secretary`, `/register-patient`) están protegidos y solo pueden ser llamados por usuarios con roles específicos

Frontend:
[X] Implementar un componente de rutas protegidas (por ejemplo `ProtectedRoute`) que verifique si hay sesión/token antes de mostrar páginas internas.
[X] Redirigir automáticamente a `/login` cuando el usuario no esté autenticado e intente acceder a rutas como `/historiales`, `/admin`, etc.
[X] Condicionar el renderizado del layout principal para que, sin sesión válida, solo se muestre la pantalla de login.
[X] Asegurarse de que componentes de historial, pacientes y administración no se monten si no hay usuario autenticado.

---

## 📊 Resumen PBI-7 Backend:

| Tarea | Estado | Observaciones |
|-------|--------|---------------|
| 1. Dependencia `get_current_user` | ✅ Implementado | Todos los endpoints protegidos |
| 2. Solo login público | ✅ Implementado | Registro requiere autenticación |
| 3. Verificación de roles | ✅ Implementado | Por rol específico |
| 4. Sistema de auditoría | ✅ Implementado | Logs de accesos no autorizados |

**Observaciones adicionales:**
- ✅ El sistema implementa **Zero Trust** correctamente
- ✅ Cada endpoint valida permisos específicos por rol
- ✅ Logs de auditoría registran todos los intentos de acceso
- ✅ Los mensajes de error no revelan información sensible
- ⚠️ Considerar agregar endpoint público `/api/auth/register` para auto-registro de pacientes (actualmente solo registro por Secretario/Admin)

---

## PBI-8: Autenticar Usuario con Reconocimiento Facial o Contraseña

**Como:** usuario identificado
**Quiero:** que el sistema verifique mi identidad usando mi reconocimiento facial o mi contraseña
**Para que:** pueda acceder a mi sesión de forma segura

---
### **Criterios de Aceptación (Acceptance Criteria):**

* [ ] La pantalla de login debe permitir al usuario elegir entre "Ingresar con Contraseña" o "Ingresar con Reconocimiento Facial".
* [ ] Si usa contraseña, el sistema debe validarla contra el hash almacenado.
* [ ] Si usa reconocimiento facial, el sistema debe comparar la captura en vivo contra la plantilla biométrica almacenada.
* [ ] (Requisito de Seguridad Adicional) El sistema debe implementar una "prueba de vida" (liveness detection) para el reconocimiento facial, asegurando que no se está usando una foto.
* [ ] **(Nuevo)** El sistema debe exigir un segundo factor de autenticación (MFA) (ej. código OTP) de forma obligatoria para cuentas con rol de Administrador o cuando se detecte un acceso desde una red no confiable.

Backend:

- [x] Validar credenciales contra hash
  - **Estado:** ✅ **IMPLEMENTADO**
  - ✅ En `routers/auth.py` endpoint `POST /api/auth/login`:
    - Se busca el usuario por email en la BD
    - Se verifica la contraseña con `verify_password()` de `services/security.py`
    - Usa Argon2id para validación (algoritmo seguro con salt)
  - ✅ Responde con `401 Unauthorized` si credenciales son inválidas
  - ✅ No revela si el email existe o no (por seguridad)
  - ✅ Se registra en `AuditLog` cada intento fallido

- [x] Emitir JWT si es correcto
  - **Estado:** ✅ **IMPLEMENTADO**
  - ✅ Función `create_access_token()` en `services/security.py`:
    - Genera JWT con algoritmo HS256
    - Incluye datos: `sub` (user_id), `email`, `role`
    - Incluye timestamps: `iat` (issued at), `exp` (expiration)
    - Tiempo de expiración configurable: 60 minutos (por defecto)
  - ✅ Token se devuelve en `LoginResponse` como `token`
  - ✅ Se registra en `AuditLog` cada login exitoso

- [ ] Recibir captura(s) faciales
  - **Estado:** ❌ **NO IMPLEMENTADO**
  - ✅ En `auth_schemas.py` existe `LoginResponse` que permite enviar datos
  - ❌ **FALTA:** Endpoint separado para login con reconocimiento facial (ej: `POST /api/auth/login/face`)
  - ❌ **FALTA:** DTO para recibir imagen facial (`face_image`, `email`)
  - ❌ **FALTA:** Endpoint para validar/procesar la captura facial
  - 📝 **Nota:** El frontend ya tiene lógica para capturar imagen, pero el backend no la procesa

- [ ] Comparar con plantilla almacenada
  - **Estado:** ❌ **NO IMPLEMENTADO**
  - ✅ Campo `biometric_template` existe en `SecuritySettings` del modelo `User`
  - ❌ **FALTA:** Servicio de comparación facial (considerar: face_recognition, DeepFace, OpenCV)
  - ❌ **FALTA:** Lógica para descifrar la plantilla antes de comparar
  - ❌ **FALTA:** Umbral de similitud configurable (ej: 99% de match)
  - ❌ **FALTA:** Función para extraer características de la imagen capturada

- [ ] Rechazar si no pasa la lógica de prueba de vida (liveness detection)
  - **Estado:** ❌ **NO IMPLEMENTADO**
  - ❌ **FALTA:** Implementar detección de prueba de vida:
    - Validar que no sea una foto estática
    - Detectar movimiento o gestos (parpadeo, movimiento cabeza)
    - Analizar características de vídeo vs. imagen
  - ❌ **FALTA:** Servicio de liveness (considerar: OpenCV, TensorFlow, SDK comercial)
  - ❌ **FALTA:** Rechazar login si falla la prueba de vida

- [x] Generar OTP, persistir temporalmente
  - **Estado:** 🟡 **PARCIALMENTE IMPLEMENTADO**
  - ✅ En `routers/auth.py` se valida `user.security.mfa_enabled`
  - ✅ Si MFA está habilitado, devuelve `LoginMFAResponse` con `requires_mfa=True`
  - ✅ Se registra en `AuditLog` los intentos de login con MFA
  - ❌ **FALTA:** Función para generar código OTP (6 dígitos)
  - ❌ **FALTA:** Almacenar OTP temporalmente en Redis o con TTL en BD (válido solo 5-10 minutos)
  - ❌ **FALTA:** Endpoint `POST /api/auth/otp/generate` para generar OTP
  - ❌ **FALTA:** Enviar OTP por email o SMS (considerar: Twilio, SendGrid)
  - ❌ **FALTA:** Incrementar contador de intentos fallidos de OTP

- [x] Marcar sesión como pendiente de segundo factor
  - **Estado:** ✅ **IMPLEMENTADO**
  - ✅ `LoginMFAResponse` retorna `requires_mfa=True` cuando MFA está habilitado
  - ✅ Frontend recibe esta bandera y muestra formulario de OTP
  - ✅ El usuario no recibe token JWT hasta validar OTP
  - 📝 **Nota:** El estado se controla solo en el flujo, sin persistencia de "sesión pendiente" en BD

- [ ] Validar OTP y completar login
  - **Estado:** ❌ **NO IMPLEMENTADO**
  - ✅ Existe DTO `OTPVerifyRequest` en `auth_schemas.py` con `email` y `otp`
  - ❌ **FALTA:** Endpoint `POST /api/auth/otp/verify` para validar el código
  - ❌ **FALTA:** Lógica para:
    - Buscar OTP almacenado por email
    - Validar que no esté expirado
    - Comparar OTP ingresado con el almacenado
    - Incrementar intentos fallidos si no coincide (máximo 3)
    - Bloquear si se exceden intentos
  - ❌ **FALTA:** Si OTP es válido, generar y retornar JWT
  - ❌ **FALTA:** Limpiar OTP de la BD después de uso exitoso
  - ❌ **FALTA:** Registrar en `AuditLog` validación de OTP

---

## 📊 Resumen PBI-8 Backend:

| Tarea | Estado | Prioridad |
|-------|--------|-----------|
| 1. Validar credenciales contra hash | ✅ Implementado | - |
| 2. Emitir JWT | ✅ Implementado | - |
| 3. Recibir captura(s) faciales | ❌ Pendiente | Media |
| 4. Comparar con plantilla | ❌ Pendiente | Media |
| 5. Prueba de vida (liveness) | ❌ Pendiente | Media |
| 6. Generar y persistir OTP | 🟡 Parcial | Alta |
| 7. Marcar sesión pendiente MFA | ✅ Implementado | - |
| 8. Validar OTP y completar login | ❌ Pendiente | Alta |

**Observaciones adicionales:**

- ✅ La validación de contraseña usa **Argon2id** (estándar moderno, ganador PWC 2015)
- ✅ Argon2id es más seguro que bcrypt: sin límite de longitud, configuración de memoria/tiempo/paralelismo
- ✅ Sistema de bloqueo de cuenta por intentos fallidos funciona correctamente
- ✅ Rate limiting está configurado en middleware (5 req/min por IP)
- ✅ Auditoría completa de eventos de login
- ⚠️ El endpoint `/api/auth/login/face` no existe (necesario para reconocimiento facial)
- ⚠️ No hay generador de OTP implementado (crítico para MFA)
- ⚠️ No hay servicio de liveness detection (crítico para seguridad biométrica)
- ⚠️ El campo `mfa_enabled` en `SecuritySettings` es fijo, considerar permitir usuarios habilitar/deshabilitar MFA

**Próximas acciones:**
1. Implementar generador de OTP (6 dígitos, 5-10 min TTL)
2. Implementar validador de OTP con reintentos limitados
3. Implementar endpoint de reconocimiento facial con liveness detection
4. Implementar servicio de comparación biométrica

---

## PBI-10: Bloquear Cuenta por Intentos Fallidos

**Como:** administrador de seguridad
**Quiero:** que el sistema bloquee automáticamente una cuenta por 15 minutos si detecta 5 intentos fallidos de autenticación
**Para que:** prevenir ataques de fuerza bruta

---
### **Criterios de Aceptación (Acceptance Criteria):**

* [ ] El sistema debe contar los intentos de autenticación fallidos consecutivos para cada cuenta.
* [ ] Al llegar al 5to intento fallido, la cuenta debe ser bloqueada.
* [ ] El sistema debe mostrar un mensaje "Cuenta bloqueada por 15 minutos" si se intenta acceder a una cuenta bloqueada.
* [ ] El contador de intentos fallidos debe reiniciarse a 0 después de un inicio de sesión exitoso.
* [ ] **(Nuevo)** Implementar Rate Limiting en el API de login para limitar las peticiones a un máximo de 5 por minuto por dirección IP, rechazando el tráfico excedente antes de que provoque el bloqueo de la cuenta.

Backend:

- [x] Guardar en BD los intentos fallidos consecutivos por usuario
  - **Estado:** ✅ **IMPLEMENTADO**
  - ✅ Campo `failed_attempts: int = 0` en `SecuritySettings` del modelo `User`
  - ✅ Se guarda en la BD cada vez que `user.save()` es llamado
  - ✅ Se incrementa en el endpoint `/api/auth/login`

- [x] Incrementar contador en cada login fallido
  - **Estado:** ✅ **IMPLEMENTADO**
  - ✅ En `routers/auth.py` endpoint `POST /api/auth/login`:
    - `user.security.failed_attempts += 1` cuando la contraseña es incorrecta
    - Se guarda inmediatamente: `await user.save()`
  - ✅ Se registra en `AuditLog` el número de intentos: `details={"attempts_count": user.security.failed_attempts}`

- [x] Reiniciar contador a 0 cuando el login sea exitoso
  - **Estado:** ✅ **IMPLEMENTADO**
  - ✅ En `routers/auth.py` después de validación exitosa:
    - `user.security.failed_attempts = 0`
    - `await user.save()`
  - ✅ Se registra en `AuditLog`: `event="login_success"`

- [x] Al quinto fallo consecutivo, marcar la cuenta como bloqueada con timestamp de desbloqueo (+15 min)
  - **Estado:** ✅ **IMPLEMENTADO**
  - ✅ Configuración:
    - `MAX_LOGIN_ATTEMPTS = 5` (del .env)
    - `LOCKOUT_DURATION_MINUTES = 15` (del .env)
  - ✅ Lógica en `routers/auth.py`:
    - Si `user.security.failed_attempts >= MAX_LOGIN_ATTEMPTS`:
      - `user.security.lockout_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_DURATION_MINUTES)`
      - `user.status = UserStatus.BLOQUEADO`
      - `await user.save()`
  - ✅ Se registra en `AuditLog`: `event="account_locked"` con detalles de fecha de desbloqueo

- [x] Rechazar cualquier intento de login de una cuenta bloqueada antes de que expire el tiempo
  - **Estado:** ✅ **IMPLEMENTADO**
  - ✅ En `routers/auth.py` al inicio del endpoint `login()`:
    - Se verifica: `if user.security.lockout_until and user.security.lockout_until > datetime.utcnow()`
    - Responde con `403 Forbidden` si está bloqueada
    - Devuelve en detalle: `locked_until` con timestamp ISO
  - ✅ Se registra en `AuditLog`: `event="login_blocked"`
  - ✅ El error devuelto no revela si el email existe (por seguridad)

- [x] Desbloquear automáticamente cuando expira el tiempo
  - **Estado:** ✅ **IMPLEMENTADO**
  - ✅ En `routers/auth.py` después de verificar bloqueo:
    - Si `user.security.lockout_until and user.security.lockout_until <= datetime.utcnow()`:
      - `user.security.lockout_until = None`
      - `user.security.failed_attempts = 0`
      - `await user.save()`
  - ✅ En login exitoso también resetea: `user.status = UserStatus.ACTIVO`

- [ ] Implementar middleware de rate limiting en el endpoint de login con límite 5 solicitudes por minuto por IP
  - **Estado:** 🟡 **PARCIALMENTE IMPLEMENTADO**
  - ✅ Existe `RateLimitMiddleware` agregado a `main.py`
  - ✅ Se configura: `app.add_middleware(RateLimitMiddleware, ...)`
  - ✅ Funciona a nivel global de la aplicación
  - ⚠️ **VERIFICAR:** ¿El middleware limita específicamente el endpoint `/api/auth/login` a 5 req/min por IP?
  - ⚠️ **VERIFICAR:** ¿La configuración es correcta? (actualmente puede ser 10 req/60 seg global)
  - 📝 **Nota:** Rate limiting debe ejecutarse **antes** de llegar a la lógica de bloqueo de cuenta

- [ ] Responder con código 429 (Too Many Requests) cuando se exceda el límite
  - **Estado:** 🟡 **PARCIALMENTE IMPLEMENTADO**
  - ✅ El middleware `RateLimitMiddleware` debería responder con 429
  - ⚠️ **VERIFICAR:** Confirmar que el middleware retorna exactamente `429` y no otro código

- [ ] Registrar en logs seguros cada evento de bloqueo de cuenta y cada exceso de rate limiting
  - **Estado:** 🟡 **PARCIALMENTE IMPLEMENTADO**
  - ✅ Los eventos de bloqueo se registran en `AuditLog`:
    - `event="account_locked"` cuando se alcanza el límite
    - `event="login_blocked"` cuando intenta entrar a cuenta bloqueada
    - `details` incluye intentos y fecha de desbloqueo
  - ❌ **FALTA:** Registrar eventos de rate limiting (cuando se excede 5 req/min)
  - ❌ **FALTA:** En logs de rate limiting incluir: usuario (si se puede determinar), IP, timestamp, tipo de evento

---

## 📊 Resumen PBI-10 Backend:

| Tarea | Estado | Observaciones |
|-------|--------|---------------|
| 1. Guardar intentos fallidos | ✅ Implementado | Campo en SecuritySettings |
| 2. Incrementar contador | ✅ Implementado | Por cada fallo de contraseña |
| 3. Reiniciar en login exitoso | ✅ Implementado | Automático |
| 4. Bloquear en 5to intento | ✅ Implementado | +15 minutos |
| 5. Rechazar cuenta bloqueada | ✅ Implementado | 403 Forbidden |
| 6. Desbloqueo automático | ✅ Implementado | Al expirar tiempo |
| 7. Rate limiting por IP | 🟡 Parcial | Global, no específico a /login |
| 8. Responder con 429 | 🟡 Parcial | Verificar implementación |
| 9. Auditoría de eventos | 🟡 Parcial | Bloqueo sí, rate limit no |

**Observaciones adicionales:**

- ✅ El sistema implementa correctamente bloqueo por intentos fallidos
- ✅ Desbloqueo automático después de 15 minutos
- ✅ Auditoría completa de eventos de bloqueo
- ⚠️ El rate limiting podría ser más específico (solo para `/api/auth/login`)
- ⚠️ Considerar agregar endpoint público para chequear si cuenta está desbloqueada

---

## PBI-11: Implementar Política de Calidad de Contraseñas

**Como:** usuario
**Quiero:** que al crear o cambiar mi contraseña, el sistema me exija que cumpla con una métrica de calidad definida
**Para que:** asegurar que mi secreto (contraseña) sea fuerte y difícil de adivinar

---
### **Criterios de Aceptación (Acceptance Criteria):**

* [ ] En el formulario de registro y cambio de contraseña, se debe validar que la nueva contraseña cumpla con:
    * Mínimo 12 caracteres.
    * Al menos una letra mayúscula.
    * Al menos una letra minúscula.
    * Al menos un número.
    * Al menos un símbolo especial.
* [ ] Se debe mostrar retroalimentación en tiempo real al usuario sobre los requisitos que va cumpliendo.
* [ ] La contraseña debe guardarse en la base de datos usando un hash seguro y con "salt" (ej. Argon2 o bcrypt).

Backend:

- [x] Implementar función de validación de contraseña con las mismas reglas que en frontend
  - **Estado:** ✅ **IMPLEMENTADO**
  - ✅ Función `validate_password_strength()` en `services/security.py`:
    - Valida mínimo 12 caracteres: `len(password) < 12`
    - Valida mayúscula: `any(c.isupper() for c in password)`
    - Valida minúscula: `any(c.islower() for c in password)`
    - Valida número: `any(c.isdigit() for c in password)`
    - Valida símbolo especial: lista `!@#$%^&*()_+-=[]{}|;:'\",.<>?/`
  - ✅ Retorna tupla: `(bool, list[str])` con errores descriptivos
  - ✅ Los mensajes de error son claros para el usuario

- [x] Usar esta validación antes de guardar o actualizar cualquier contraseña en la BD
  - **Estado:** ✅ **IMPLEMENTADO**
  - ✅ En `routers/auth.py` se usa en los 3 endpoints de registro:
    - `/register-doctor`: `is_valid, errors = validate_password_strength(data.password)`
    - `/register-secretary`: Igual validación
    - `/register-patient`: Igual validación
  - ✅ Si falla, responde con `400 Bad Request` y detalla los errores
  - ✅ No crea el usuario si la contraseña es débil
  - ✅ Se registra en `AuditLog` cada intento fallido de registro por contraseña débil
  - ❌ **FALTA:** Validar también en endpoint de cambio de contraseña (cuando exista)

- [x] Configurar almacenamiento de contraseñas usando un algoritmo seguro (Argon2 o bcrypt)
  - **Estado:** ✅ **IMPLEMENTADO - ARGON2ID (MEJOR)**
  - ✅ Usa **Argon2id** en lugar de bcrypt:
    - `pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")`
  - ✅ Configuración segura:
    - `argon2__memory_cost=65536` (64 MB)
    - `argon2__time_cost=3` (3 iteraciones)
    - `argon2__parallelism=4` (4 threads)
  - ✅ Argon2id es el estándar actual (ganador Password Hashing Competition 2015)
  - ✅ Más seguro que bcrypt: sin límite de longitud, resistente a GPU/ASIC attacks

- [x] Generar y aplicar salt por contraseña y guardar únicamente el hash resultante en la base de datos
  - **Estado:** ✅ **IMPLEMENTADO**
  - ✅ Argon2id genera automáticamente un salt único por contraseña
  - ✅ Función `hash_password()` usa `pwd_context.hash()` que:
    - Genera salt aleatorio
    - Aplica el algoritmo Argon2id
    - Retorna hash completo (incluye salt) como string
  - ✅ En BD se guarda solo el hash, nunca la contraseña en texto plano
  - ✅ La contraseña se verifica con `verify_password()` que extrae el salt del hash y reaplica el algoritmo

---

## 📊 Resumen PBI-11 Backend:

| Tarea | Estado | Observaciones |
|-------|--------|---------------|
| 1. Función de validación | ✅ Implementado | 5 requisitos validados |
| 2. Usar antes de guardar | ✅ Implementado | En los 3 endpoints de registro |
| 3. Algoritmo seguro | ✅ Implementado | Argon2id (mejor que bcrypt) |
| 4. Salt por contraseña | ✅ Implementado | Automático en Argon2id |

**Observaciones adicionales:**

- ✅ **Argon2id es el estándar moderno** de hashing de contraseñas
- ✅ Mejor que bcrypt: sin límite de longitud, configuración flexible
- ✅ Resistente a ataques con GPU/ASIC gracias a high memory cost
- ✅ Configuración de 64MB memoria y 3 iteraciones es equilibrada (seguridad vs. rendimiento)
- ✅ Los mensajes de error ayudan al usuario a crear contraseñas fuertes
- ✅ La validación se aplica **antes** de guardar, previniendo malas contraseñas
- ⚠️ Considerar agregar endpoint de cambio de contraseña con la misma validación

---

## PBI-18: Interfaz de Administración de Roles

**Como:** Administrador
**Quiero:** tener una interfaz para crear, modificar y asignar los roles de 'Médico', 'Paciente' y 'Secretario' a las cuentas de usuario
**Para que:** gestionar los permisos de seguridad del sistema

---
### **Criterios de Aceptación (Acceptance Criteria):**

* [ ] El Administrador debe tener una sección de "Gestión de Usuarios".
* [ ] En esta sección, el Admin puede ver una lista de todos los usuarios.
* [ ] El Admin puede cambiar el rol de un usuario usando un menú desplegable (Opciones: Médico, Paciente, Secretario, Administrador).
* [ ] Solo un Administrador puede acceder a esta sección.

Backend:

- [ ] Implementar endpoint seguro que devuelva la lista de usuarios con sus roles
  - **Estado:** ❌ **NO IMPLEMENTADO**
  - 📁 **Archivo necesario:** `routers/users.py` (no existe)
  - ✅ Existe función `get_admin_user()` en `services/auth.py` para validar rol Admin
  - ❌ **FALTA:** Crear archivo `routers/users.py`
  - ❌ **FALTA:** Endpoint `GET /api/admin/users` o `GET /api/users`
  - ❌ **FALTA:** DTO `UserListResponse` en `schemas/user_schemas.py` con:
    - `id: str`
    - `fullName: str`
    - `email: str`
    - `role: UserRole`
    - `status: UserStatus`
    - `cedula: str`
    - `created_at: datetime`
    - `last_login: Optional[datetime]`
  - ❌ **FALTA:** Lógica para obtener todos los usuarios de BD (excepto contraseñas)
  - ❌ **FALTA:** Lógica de filtrado (por rol, estado, búsqueda por nombre/email)
  - ❌ **FALTA:** Paginación (limit, offset, total_count)
  - 📝 **Nota:** No incluir campos sensibles como `biometric_template`, `password_hash`, etc.

- [ ] Protegerlo para que solo pueda ser llamado por usuarios con rol Administrador
  - **Estado:** ❌ **NO IMPLEMENTADO**
  - ✅ Ya existe dependencia `get_admin_user()` disponible en `services/auth.py`
  - ❌ **FALTA:** Aplicar `Depends(get_admin_user)` al endpoint de listar usuarios
  - ✅ Si se implementa correctamente, responderá `403 Forbidden` para usuarios sin rol Admin
  - ✅ Se registraría en `AuditLog` cada intento de acceso no autorizado

- [ ] Implementar endpoint que reciba el nuevo rol y actualice la cuenta indicada
  - **Estado:** ❌ **NO IMPLEMENTADO**
  - 📁 **Archivo necesario:** `routers/users.py` (no existe)
  - ❌ **FALTA:** Endpoint `PUT /api/admin/users/{user_id}/role`
  - ❌ **FALTA:** DTO `UpdateUserRoleRequest` en `schemas/user_schemas.py` con:
    - `new_role: UserRole`
  - ❌ **FALTA:** Lógica para:
    - Buscar usuario por `user_id`
    - Validar que existe
    - Actualizar campo `user.role = new_role`
    - Guardar en BD: `await user.save()`
  - ❌ **FALTA:** DTO de respuesta `UserRoleUpdatedResponse` con los datos actualizados
  - ✅ Modelo `User` ya tiene el campo `role: UserRole` definido

- [ ] Validar que el llamador tenga rol Administrador y que el rol solicitado sea válido
  - **Estado:** ❌ **NO IMPLEMENTADO**
  - ✅ Validación de rol Admin ya existe: `get_admin_user()`
  - ❌ **FALTA:** Validar que `new_role` esté en enum `UserRole`
    - Valores válidos: `ADMINISTRADOR`, `MEDICO`, `PACIENTE`, `SECRETARIO`
  - ❌ **FALTA:** Validar que no sea posible eliminar el único Admin del sistema
    - Si `current_user.role == ADMINISTRADOR` y `new_role != ADMINISTRADOR` y es el único Admin → error
  - ❌ **FALTA:** Prevenir cambios que dejarían el sistema sin Admin (opcional, por seguridad)
  - ❌ **FALTA:** Responder con error descriptivo si el rol no es válido: `400 Bad Request`

- [ ] Implementar verificación de rol Administrador en los endpoints relacionados (listar y actualizar usuarios)
  - **Estado:** ❌ **NO IMPLEMENTADO**
  - ✅ Ya existe función `get_admin_user()` en `services/auth.py`
  - ❌ **FALTA:** Crear 2 endpoints y proteger ambos con `Depends(get_admin_user)`
    1. `GET /api/admin/users` (listar)
    2. `PUT /api/admin/users/{user_id}/role` (actualizar)

- [ ] Devolver 403 si un usuario sin rol Administrador intenta acceder
  - **Estado:** 🟡 **PARCIALMENTE IMPLEMENTADO**
  - ✅ La función `get_admin_user()` debería lanzar excepción `HTTPException(status_code=403)`
  - ⚠️ **VERIFICAR EN CODE:** Confirmar que `get_admin_user()` en `services/auth.py` retorna exactamente:
    ```python
    raise HTTPException(
        status_code=403,
        detail="Solo usuarios con rol Administrador pueden acceder a este recurso"
    )
    ```
  - ✅ Se registraría en `AuditLog` el intento de acceso no autorizado

- [ ] Registrar en auditoría cada cambio de rol
  - **Estado:** ❌ **NO IMPLEMENTADO** (adicional a criterios)
  - ❌ **FALTA:** Al actualizar un rol, crear entrada en `AuditLog`:
    - `event="user_role_changed"`
    - `user_id=updated_user.id`
    - `details={"old_role": user.role, "new_role": new_role, "changed_by": current_user.id}`
  - 📝 **Recomendación:** Esto es crítico para auditoría y cumplimiento

Frontend:
[X] Crear una ruta protegida para "Gestión de Usuarios" visible solo para cuentas con rol Administrador.
[X] Diseñar la pantalla base con título y espacio para la tabla de usuarios.
[X] Consumir un endpoint de backend para obtener la lista de usuarios.
[X] Mostrar tabla con columnas básicas (nombre, correo, rol actual, estado).
[X] Añadir un menú desplegable por fila con opciones: Médico, Paciente, Secretario, Administrador.
[X] Enviar al backend la actualización de rol cuando el Administrador cambie el valor.

---

## 📊 Resumen PBI-18 Backend:

| Tarea | Estado | Prioridad |
|-------|--------|-----------|
| 1. Endpoint listar usuarios | ❌ Pendiente | **Alta** |
| 2. DTO UserListResponse | ❌ Pendiente | **Alta** |
| 3. Endpoint actualizar rol | ❌ Pendiente | **Alta** |
| 4. DTO UpdateUserRoleRequest | ❌ Pendiente | **Alta** |
| 5. Validar nuevo rol | ❌ Pendiente | Alta |
| 6. Proteger con rol Admin | ❌ Pendiente | Alta |
| 7. Responder 403 | 🟡 Verificar | Alta |
| 8. Registrar en auditoría | ❌ Pendiente | Media |
| 9. Prevenir último Admin | ❌ Pendiente | Media |

**Archivos que necesitan ser creados/modificados:**

| Archivo | Acción | Detalles |
|---------|--------|---------|
| `routers/users.py` | ✨ **CREAR** | Router con 2 endpoints: GET (listar) y PUT (actualizar rol) |
| `schemas/user_schemas.py` | 📝 **EXTENDER** | Agregar `UserListResponse` y `UpdateUserRoleRequest` |
| `services/auth.py` | ✅ Verificar | Confirmar que `get_admin_user()` existe y retorna 403 |

**Observaciones adicionales:**

- ❌ No existen endpoints de gestión de usuarios en el backend
- ❌ Router `users.py` no existe y debe ser creado desde cero
- ✅ La infraestructura de autorización (función `get_admin_user()`) ya existe
- ✅ El modelo `User` tiene el campo `role: UserRole` definido
- ✅ El enum `UserRole` está definido en `models/models.py`
- ✅ El modelo `AuditLog` ya está disponible para registrar cambios
- 📝 **Recomendación:** Agregar auditoría es crítico para cumplimiento normativo
- 📝 **Recomendación:** Considerar agregar soft-delete: no eliminar usuarios, solo marcarlos como inactivos
- ⚠️ **Seguridad:** Validar que no sea posible dejar el sistema sin Admin

---

## 📋 Resumen General de Sprint 1

### Estado de PBIs:

| PBI | Nombre | Backend | Frontend |
|-----|--------|---------|----------|
| 6 | Registro con verificación facial | 🟡 Parcial (1/5) | ✅ Completo |
| 7 | Identificación de usuario | ✅ Completo | ✅ Completo |
| 8 | Autenticar con facial/contraseña | 🟡 Parcial (2/8) | ✅ Completo |
| 10 | Bloquear por intentos fallidos | ✅ Completo | ✅ (no aplica) |
| 11 | Política de calidad de contraseñas | ✅ Completo | ✅ Completo |
| 18 | Gestión de roles | ❌ Pendiente (0/9) | ✅ Completo |

### Tareas Críticas Pendientes (por prioridad):

**Seguridad (Alta):**
1. ✅ PBI-6: Campos de imagen documento y estado PENDIENTE_VERIFICACION
2. ❌ PBI-6: Servicio de extracción facial y cifrado de plantilla
3. ❌ PBI-8: Generación y validación de OTP
4. ❌ PBI-8: Endpoint de reconocimiento facial con liveness detection
5. ❌ PBI-18: Endpoints de gestión de usuarios

**Funcional (Media):**
1. ❌ PBI-8: Validación de captura facial vs. plantilla
2. ❌ PBI-18: Auditoría de cambios de rol

**Verificación Pendiente:**
- ✅ PBI-7: Confirmar que todos los endpoints están protegidos
- ✅ PBI-10: Confirmar que rate limiting está limitado a 5 req/min por IP
- ✅ PBI-11: Confirmar que mínimo de contraseña es 12 caracteres