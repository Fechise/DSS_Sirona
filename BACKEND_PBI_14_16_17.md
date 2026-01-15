# Backend API Requirements - PBI 14, 16, 17

## Overview
This document specifies the backend API requirements for implementing security and data isolation features for patient clinical records access by doctors.

---

## PBI-14: Clear Patient Data on Navigation

### Purpose
Prevent sensitive information leakage when a doctor navigates from one patient's record to another within the same session.

### Frontend Implementation Notes
- **Route Pattern**: `/medico/pacientes/:patientId/historial`
- **State Management**: All patient-specific state is cleared when `patientId` parameter changes
- **API Call Trigger**: New fetch request is made every time `patientId` changes (via `useEffect` dependency)

### Backend Requirements

#### Endpoint
```
GET /api/doctor/patients/:patientId/clinical-record
```

#### Authentication
- **Required**: Bearer token (JWT)
- **Role**: Doctor (`medico`)

#### Authorization Rules
- Doctor can ONLY access clinical records of patients assigned to them
- If `patientId` does not belong to the requesting doctor → **403 Forbidden**

#### Response (Success - 200 OK)
```json
{
  "id": "rec-uuid",
  "patientId": "patient-uuid",
  "patientName": "Juan Pérez",
  "patientCedula": "1234567890",
  "doctorId": "doctor-uuid",
  "doctorName": "Dr. Roberto García",
  "fecha": "2026-01-08T10:00:00Z",
  "motivoConsulta": "Control de hipertensión...",
  "historiaEnfermedadActual": "Paciente masculino de 52 años...",
  "antecedentesPersonales": ["Hipertensión arterial...", "Prediabetes..."],
  "antecedentesQuirurgicos": ["Apendicectomía en 2001"],
  "medicamentos": ["Losartán 50 mg cada 12 horas", "Atorvastatina 20 mg"],
  "alergias": ["Penicilina"],
  "historiaSocial": {
    "tabaquismo": "Exfumador...",
    "alcohol": "Social, 1-2 unidades por semana",
    "ocupacion": "Contador público",
    "actividadFisica": "Camina 30 min, 3-4 veces por semana"
  },
  "antecedentesFamiliares": ["Madre: Hipertensión", "Padre: Diabetes tipo 2"],
  "revisionSistemas": [
    { "sistema": "Cardiovascular", "hallazgos": "Niega dolor torácico..." },
    { "sistema": "Respiratorio", "hallazgos": "Niega tos..." },
    { "sistema": "Neurológico", "hallazgos": "Cefaleas leves..." }
  ],
  "examenFisico": {
    "signosVitales": {
      "tensionArterial": "132/84 mmHg",
      "frecuenciaCardiaca": "72 lpm",
      "temperatura": "36.7 °C",
      "frecuenciaRespiratoria": "16 rpm",
      "saturacion": "98%"
    },
    "hallazgos": {
      "general": "Buen estado general...",
      "cardiovascular": "Ritmo regular...",
      "respiratorio": "Murmullo vesicular...",
      "abdomen": "Blando, depresible...",
      "neurologico": "Sin déficit motor..."
    }
  },
  "laboratorios": [
    { "prueba": "Glucosa", "valor": "98", "unidad": "mg/dL", "referencia": "70-99", "fecha": "2025-12-20" }
  ],
  "imagenes": [
    { "estudio": "ECG", "fecha": "2025-10-10", "impresion": "Ritmo sinusal..." }
  ],
  "diagnostico": "Hipertensión arterial controlada",
  "tratamiento": "Continuar Losartán 50 mg...",
  "observaciones": "Se sugiere monitoreo domiciliario...",
  "seguimiento": {
    "fecha": "2026-02-08",
    "instrucciones": "Control en consulta externa..."
  },
  "ultimaModificacion": "2026-01-08T14:30:00Z"
}
```

#### Error Responses

**403 Forbidden** (Patient not assigned to this doctor)
```json
{
  "error": "Forbidden",
  "message": "No tienes permiso para acceder al historial de este paciente"
}
```

**404 Not Found** (Patient or record does not exist)
```json
{
  "error": "Not Found",
  "message": "No se encontró el historial médico del paciente"
}
```

**401 Unauthorized** (Invalid or missing token)
```json
{
  "error": "Unauthorized",
  "message": "Token inválido o expirado"
}
```

---

## PBI-16: Session-Based Access Control

### Purpose
Ensure that doctors can only access clinical records during an active session and that session tokens expire appropriately.

### Backend Requirements

#### Session Token Management
- **Token Type**: JWT
- **Expiration**: Configurable (recommended: 8 hours for active use, refresh after 1 hour of inactivity)
- **Storage**: Frontend stores token in `localStorage` or `sessionStorage`
- **Refresh Endpoint**: `POST /api/auth/refresh` (optional, for token renewal)

#### Token Payload (JWT Claims)
```json
{
  "userId": "doctor-uuid",
  "role": "medico",
  "email": "doctor@example.com",
  "iat": 1704902400,
  "exp": 1704931200
}
```

#### Authorization Middleware
- All `/api/doctor/*` routes must validate:
  1. Token is present and valid
  2. Token has not expired
  3. User role is `medico`
  4. User is active (not suspended/deleted)

---

## PBI-17: Audit Logging for Clinical Record Access

### Purpose
Track all access to patient clinical records for security audits and compliance.

### Backend Requirements

#### Audit Log Entry (on every GET request to clinical records)
```json
{
  "eventType": "CLINICAL_RECORD_ACCESS",
  "doctorId": "doctor-uuid",
  "patientId": "patient-uuid",
  "timestamp": "2026-01-08T14:30:00Z",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "result": "SUCCESS" // or "FORBIDDEN", "NOT_FOUND"
}
```

#### Audit Endpoint (Optional - for admin/doctor to review access logs)
```
GET /api/doctor/audit-logs?patientId=:patientId&startDate=:date&endDate=:date
```

**Response Example:**
```json
{
  "logs": [
    {
      "timestamp": "2026-01-08T14:30:00Z",
      "action": "CLINICAL_RECORD_ACCESS",
      "patientName": "Juan Pérez",
      "result": "SUCCESS"
    }
  ],
  "total": 42
}
```

---

## Security Notes

### Data Isolation
- Every API request must validate that the requesting doctor has an active doctor-patient relationship.
- Queries should include a `WHERE doctor_id = :current_doctor_id` filter to prevent SQL injection-based access to other doctors' patients.

### HTTPS Only
- All endpoints must be served over HTTPS in production.
- HTTP Strict Transport Security (HSTS) headers should be enabled.

### Rate Limiting
- Implement rate limiting on clinical record endpoints to prevent brute-force attempts or data scraping.
- Suggested limit: 100 requests per minute per doctor.

### CORS Policy
- Allow requests only from the frontend domain (e.g., `https://sirona-frontend.com`).
- Do not use wildcard (`*`) in CORS `Access-Control-Allow-Origin` header.

---

## Implementation Checklist

### PBI-14
- [ ] Implement `GET /api/doctor/patients/:patientId/clinical-record` endpoint
- [ ] Validate doctor-patient relationship before returning data
- [ ] Return 403 if patient is not assigned to requesting doctor
- [ ] Return 404 if patient or record does not exist

### PBI-16
- [ ] Implement JWT-based authentication middleware
- [ ] Set appropriate token expiration times
- [ ] Create token refresh endpoint (optional)
- [ ] Validate token on every protected route

### PBI-17
- [ ] Create audit log table/collection in database
- [ ] Log every access attempt (success and failure) to clinical records
- [ ] Include timestamp, doctor ID, patient ID, IP, user agent, and result
- [ ] (Optional) Create audit log query endpoint for admin/doctor review

---

## Testing Scenarios

### PBI-14 Testing
1. **Scenario**: Doctor A navigates from Patient 1 to Patient 2 (both assigned to Doctor A)
   - **Expected**: Both records load successfully, no data overlap
2. **Scenario**: Doctor A tries to access Patient 3 (assigned to Doctor B)
   - **Expected**: 403 Forbidden response
3. **Scenario**: Doctor A navigates back to Patient 1 after viewing Patient 2
   - **Expected**: Patient 1 data is fetched fresh from API (no stale cache)

### PBI-16 Testing
1. **Scenario**: Doctor accesses clinical record with valid token
   - **Expected**: 200 OK response with full record
2. **Scenario**: Doctor accesses clinical record with expired token
   - **Expected**: 401 Unauthorized response
3. **Scenario**: Non-doctor user (e.g., admin) tries to access `/api/doctor/patients/:id/clinical-record`
   - **Expected**: 403 Forbidden response

### PBI-17 Testing
1. **Scenario**: Doctor accesses clinical record successfully
   - **Expected**: Audit log entry created with "SUCCESS" result
2. **Scenario**: Doctor attempts unauthorized access (403)
   - **Expected**: Audit log entry created with "FORBIDDEN" result
3. **Scenario**: Admin queries audit logs for a specific patient
   - **Expected**: All access attempts to that patient's record are returned

---

## Implementation Checklist

### PBI-14 (Backend)
- [ ] Implement `GET /api/doctor/patients/:patientId/clinical-record` endpoint
- [ ] Validate doctor-patient relationship before returning data
- [ ] Return 403 if patient is not assigned to requesting doctor
- [ ] Return 404 if patient or record does not exist
- [ ] Create audit log entry on every access attempt

### PBI-16 (Backend)
- [ ] Implement JWT-based authentication middleware
- [ ] Set appropriate token expiration times
- [ ] Create token refresh endpoint (optional)
- [ ] Validate token on every protected route
- [ ] Implement session validation on all `/api/doctor/*` routes

### PBI-17 (Backend)
- [ ] Create audit log table/collection in database
- [ ] Log every access attempt (success and failure) to clinical records
- [ ] Include timestamp, doctor ID, patient ID, IP, user agent, and result
- [ ] (Optional) Create audit log query endpoint for admin/doctor review

---

## Frontend Integration Notes
- All API calls to clinical records should include the `Authorization: Bearer <token>` header.
- On 401 responses, frontend redirects user to login page and clears local authentication state.
- On 403 responses, frontend shows "Access Denied" message and redirects to patient list.
- Frontend implements retry logic with exponential backoff for network errors (but NOT for 403/404 errors).

---

## PBI-17 (Payment Gateway HTTPS/TLS Hardening)

### Purpose
Guarantee confidentiality and integrity when Sirona connects to the external payment gateway.

### Backend Requirements (to implement later)
- Force all outbound calls to the gateway to use `https://` endpoints only.
- Enforce TLS 1.3 exclusively (disable TLS 1.2 and below) to avoid downgrade attacks.
- Fail closed on TLS/certificate issues (invalid/expired/self-signed/hostname mismatch).
- Surface a generic error to the frontend (no sensitive certificate details).
- Backend must return only HTTPS redirect URLs to the frontend.

### Frontend Expectations
- Redirect to the payment gateway only if the URL starts with `https://`; otherwise block and show an error.
- If the backend reports TLS/certificate/connection errors, show a generic payment error message (do not display certificate details).

---

## PBI-15: Auditoría de acciones sobre historiales

### Purpose
Registrar lecturas y ediciones de historiales clínicos, vinculadas a la sesión, con trazabilidad e inmutabilidad.

### Backend Requirements (para implementar más adelante)
- Crear log en cada **lectura** y **guardado** de historial (GET y PUT/POST), ligado a la sesión/JWT.
- Campos mínimos: `userId`, `role`, `patientId`, `action` (`READ`/`UPDATE`), `timestamp`.
- Enviar los logs a un servidor centralizado WORM (Write Once Read Many); no permitir borrado/edición.
- Forzar timestamps confiables: sincronizar todos los nodos con **NTP seguro** y registrar desvíos si ocurren.
- Incluir IP y user-agent cuando estén disponibles para fortalecer no repudio.

### Frontend Expectations
- La UI **no muestra** detalles de auditoría al usuario final (solo mensajes funcionales). No exponer logs en pantallas.
- Las acciones de abrir/guardar historial deben invocar los endpoints que disparan la auditoría (GET para leer, PUT/POST para guardar). Sin cambios visibles en UI.

---

## PBI-20: Integridad de historiales con hashes

### Purpose
Detectar modificaciones no autorizadas o corrupción en historiales mediante hashes y alertar al administrador.

### Backend Requirements (para implementar más adelante)
- Al guardar (crear o modificar) un historial, generar/recalcular un hash seguro (p. ej. SHA-256) del contenido clínico y almacenarlo junto al registro.
- Base de datos con cifrado en reposo (AES-256) y claves en un almacén seguro separado.
- (Opcional) Proceso periódico (p. ej. nocturno) que valide hashes de historiales.
- Si el hash no coincide:
  - Marcar el registro como "potencialmente corrupto".
  - Bloquear acceso al registro para todos excepto Admin.
  - Enviar alerta inmediata al administrador.

### Frontend Expectations
- Si el backend responde "registro corrupto" o 403 por integridad, mostrar: **"Historial bloqueado por integridad"** y ocultar/limpiar datos del historial en pantalla.
- No mostrar información residual; limpiar estado local asociado al historial cuando se reciba el error.

---

## PBI-HTTPS: Forzar HTTPS y TLS 1.3 en todo Sirona

### Purpose
Garantizar confidencialidad e integridad de toda la comunicación del sitio mediante HTTPS y TLS 1.3.

### Backend/Infra Requirements (para implementar más adelante)
- Redirigir automáticamente todo tráfico `http://` a `https://`.
- Enviar cabecera `Strict-Transport-Security` (HSTS) para forzar sólo HTTPS.
- Certificado TLS válido con calificación A/A+ (SSL Labs u otra herramienta).
- Aceptar únicamente TLS 1.3 y suites de cifrado robustas; deshabilitar SSL y TLS antiguos.

### Frontend Expectations
- No se requiere cambio de UI; evitar introducir URLs `http://` en código. Preferir URLs relativas o `https://`.
