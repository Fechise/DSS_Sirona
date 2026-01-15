# API Endpoint - Historial Clínico del Paciente

## GET `/api/paciente/mi-historial`

Obtener el historial clínico personal completo del paciente autenticado (solo lectura).

---

## Request

**Headers:**
```
Authorization: Bearer <patient-token>
Content-Type: application/json
```

**Método:** `GET`

**Autenticación:** Requerida (Bearer Token)

**Rol Requerido:** `Paciente`

---

## Response Success (200)

```json
{
  "id": "hist_001",
  "tipoSangre": "O+",
  "alergias": ["Penicilina", "Polen"],
  "condicionesCronicas": ["Hipertensión arterial", "Diabetes tipo 2 controlada"],
  "medicamentosActuales": [
    "Losartán 50mg - Una vez al día",
    "Metformina 850mg - Dos veces al día",
    "Aspirina 100mg - Una vez al día"
  ],
  "medicoAsignado": {
    "nombre": "Dr. Roberto García López",
    "especialidad": "Medicina Interna",
    "telefono": "+34 912 345 678"
  },
  "contactoEmergencia": {
    "nombre": "Pedro Martínez",
    "relacion": "Esposo",
    "telefono": "+34 612 345 678"
  },
  "consultas": [
    {
      "id": "cons_003",
      "fecha": "2026-01-08",
      "motivo": "Control trimestral",
      "diagnostico": "Hipertensión arterial controlada",
      "tratamiento": "Continuar con medicación actual",
      "notasMedico": "Paciente muestra mejora significativa. Presión arterial estable. Se recomienda continuar con ejercicio regular y dieta baja en sodio."
    },
    {
      "id": "cons_002",
      "fecha": "2025-10-15",
      "motivo": "Consulta de seguimiento",
      "diagnostico": "Diabetes tipo 2 en control",
      "tratamiento": "Ajuste de dosis de Metformina",
      "notasMedico": "Niveles de glucosa en sangre dentro de rango objetivo. Se aumenta dosis de Metformina a 850mg dos veces al día."
    },
    {
      "id": "cons_001",
      "fecha": "2025-07-20",
      "motivo": "Consulta inicial",
      "diagnostico": "Hipertensión arterial leve, Prediabetes",
      "tratamiento": "Inicio de tratamiento farmacológico y cambios en estilo de vida",
      "notasMedico": "Primera consulta. Se inicia tratamiento con Losartán 50mg y Metformina 500mg. Se recomienda pérdida de peso y ejercicio regular."
    }
  ],
  "vacunas": [
    {
      "nombre": "COVID-19 (Refuerzo)",
      "fecha": "2025-11-10"
    },
    {
      "nombre": "Influenza",
      "fecha": "2025-10-05",
      "proximaDosis": "2026-10-05"
    },
    {
      "nombre": "Tétanos",
      "fecha": "2024-03-15",
      "proximaDosis": "2034-03-15"
    }
  ],
  "antecedentesFamiliares": [
    "Madre: Hipertensión arterial",
    "Padre: Diabetes tipo 2",
    "Hermano: Sin antecedentes relevantes"
  ],
  "proximaCita": {
    "fecha": "2026-04-08T10:00:00Z",
    "motivo": "Control trimestral de rutina",
    "medico": "Dr. Roberto García López"
  },
  "ultimaModificacion": "2026-01-08T14:30:00Z"
}
```

---

## Error Responses

### 401 Unauthorized
**Código:** `401`  
**Descripción:** Token inválido o sesión expirada

```json
{
  "error": "Unauthorized. Please login again."
}
```

**Acción Frontend:** Redirigir automáticamente a `/login` después de 2 segundos

---

### 403 Forbidden
**Código:** `403`  
**Descripción:** El usuario no tiene rol de Paciente o intenta acceder a historial ajeno

```json
{
  "error": "Access denied. This action is not permitted."
}
```

**Acción Frontend:** Mostrar mensaje genérico sin detalles de seguridad

---

### 404 Not Found
**Código:** `404`  
**Descripción:** No existe historial clínico para este paciente

```json
{
  "error": "Medical history not found"
}
```

**Acción Frontend:** Mostrar mensaje "Sin Historial Clínico"

---

## Modelo de Datos

### Campos Principales

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | string | ✅ | ID único del historial |
| `tipoSangre` | string | ✅ | Tipo de sangre (A+, A-, B+, B-, AB+, AB-, O+, O-) |
| `alergias` | string[] | ✅ | Lista de alergias conocidas (puede estar vacía) |
| `condicionesCronicas` | string[] | ✅ | Condiciones médicas crónicas (puede estar vacía) |
| `medicamentosActuales` | string[] | ✅ | Medicamentos actuales con dosis e indicaciones |
| `medicoAsignado` | object | ✅ | Información del médico de cabecera |
| `contactoEmergencia` | object | ✅ | Contacto de emergencia del paciente |
| `consultas` | array | ✅ | Historial de consultas médicas |
| `vacunas` | array | ✅ | Registro de vacunas aplicadas |
| `antecedentesFamiliares` | string[] | ✅ | Antecedentes médicos familiares |
| `proximaCita` | object\|null | ❌ | Próxima cita programada (opcional) |
| `ultimaModificacion` | string (ISO 8601) | ✅ | Última actualización del historial |

---

### Objeto `medicoAsignado`

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `nombre` | string | ✅ | Nombre completo del médico |
| `especialidad` | string | ✅ | Especialidad médica |
| `telefono` | string | ✅ | Teléfono de contacto del médico |

---

### Objeto `contactoEmergencia`

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `nombre` | string | ✅ | Nombre completo del contacto |
| `relacion` | string | ✅ | Relación con el paciente (ej: "Esposo", "Madre") |
| `telefono` | string | ✅ | Teléfono de contacto |

---

### Objeto `consultas[]`

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | string | ✅ | ID único de la consulta |
| `fecha` | string (ISO 8601) | ✅ | Fecha de la consulta |
| `motivo` | string | ✅ | Motivo de la consulta |
| `diagnostico` | string | ✅ | Diagnóstico realizado por el médico |
| `tratamiento` | string | ✅ | Tratamiento prescrito |
| `notasMedico` | string | ✅ | Notas adicionales del médico |

---

### Objeto `vacunas[]`

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `nombre` | string | ✅ | Nombre de la vacuna |
| `fecha` | string (ISO 8601) | ✅ | Fecha de aplicación |
| `proximaDosis` | string (ISO 8601) | ❌ | Fecha de próxima dosis (opcional) |

---

### Objeto `proximaCita` (opcional)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `fecha` | string (ISO 8601) | ✅ | Fecha y hora de la cita |
| `motivo` | string | ✅ | Motivo de la cita |
| `medico` | string | ✅ | Nombre del médico que atenderá |

---

## Lógica Requerida en Backend

### Autenticación y Autorización
1. ✅ **Verificar token Bearer** - Token válido y no expirado
2. ✅ **Verificar rol** - Usuario debe tener rol `Paciente`
3. ✅ **Aislar datos** - Devolver solo el historial del usuario autenticado
4. ❌ **Prohibir acceso cruzado** - Un paciente no puede ver historiales de otros

### Respuestas
- **401** si token inválido o expirado
- **403** si usuario no es Paciente o intenta acceder a historial ajeno
- **404** si no existe historial para el paciente
- **200** si todo es correcto

### Ordenamiento
- Las **consultas** deben ordenarse de **más reciente a más antigua** (DESC por fecha)
- Las **vacunas** pueden ordenarse por fecha de aplicación

### Campos Opcionales
- `proximaCita` puede ser `null` si no hay cita programada
- `vacunas[].proximaDosis` puede ser `null` si no aplica refuerzo
- Arrays vacíos `[]` son válidos para `alergias`, `condicionesCronicas`, etc.

### Modo Solo Lectura
- Este endpoint es **GET only** - no permite modificaciones
- Los pacientes **no pueden editar** su historial
- Solo los médicos pueden actualizar historiales (endpoint separado)

---

## Testing

### Casos de Prueba

#### ✅ Caso Exitoso
**Request:**
```bash
curl -X GET http://localhost:8000/api/paciente/mi-historial \
  -H "Authorization: Bearer valid_patient_token"
```

**Expected:** Status 200 con todos los campos del historial

---

#### ❌ Token Inválido
**Request:**
```bash
curl -X GET http://localhost:8000/api/paciente/mi-historial \
  -H "Authorization: Bearer invalid_token"
```

**Expected:** Status 401 con mensaje de sesión expirada

---

#### ❌ Usuario No Paciente
**Request:**
```bash
curl -X GET http://localhost:8000/api/paciente/mi-historial \
  -H "Authorization: Bearer doctor_token"
```

**Expected:** Status 403 con mensaje de acceso denegado

---

#### ❌ Historial No Encontrado
**Request:**
```bash
curl -X GET http://localhost:8000/api/paciente/mi-historial \
  -H "Authorization: Bearer patient_without_history_token"
```

**Expected:** Status 404 con mensaje de historial no encontrado

---

## Seguridad

### Consideraciones
- ✅ **Datos sensibles** - Este endpoint maneja información médica confidencial (PHI/PII)
- ✅ **Cifrado** - Usar HTTPS en producción
- ✅ **HIPAA/GDPR** - Cumplir con regulaciones de privacidad médica
- ✅ **Logs de auditoría** - Registrar todos los accesos al historial
- ✅ **Rate limiting** - Limitar requests para prevenir abuso

### Rate Limiting Recomendado
- **30 requests por minuto** por usuario
- **100 requests por hora** por usuario

---

## Frontend Integration

**Archivo:** `PatientHistoryPage.tsx`

**Ubicación:** `/paciente/mi-historial`

**Componente:** `PatientHistoryPage`

**Características:**
- Muestra información en modo solo lectura
- Manejo de errores 401/403/404/5xx
- Loading states durante carga
- Diseño responsive
- Secciones organizadas por tipo de información

**Mock Data Location:**
Ver líneas 65-135 en `PatientHistoryPage.tsx` para ejemplo de mock data completo
