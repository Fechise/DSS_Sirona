# API: Historial Médico del Paciente (Vista Médico)

## Resumen
Endpoints para que el médico consulte y actualice el historial clínico de un paciente específico.

- Base: `/api/medico/pacientes/{patientId}/historial`
- Auth: Bearer JWT
- Rol requerido: Médico
- Rate limit sugerido: 60/min, 300/hora
- Auditoría: log de usuario, paciente, timestamp y cambios

## Modelo de Datos (ClinicalRecord)
```json
{
  "id": "string",
  "patientId": "string",
  "patientName": "string",
  "patientCedula": "string",
  "doctorId": "string",
  "doctorName": "string",
  "fecha": "YYYY-MM-DD",
  "motivoConsulta": "string",
  "historiaEnfermedadActual": "string",
  "antecedentesPersonales": ["string"],
  "antecedentesQuirurgicos": ["string"],
  "medicamentos": ["string"],
  "alergias": ["string"],
  "historiaSocial": {
    "tabaquismo": "string",
    "alcohol": "string",
    "ocupacion": "string",
    "actividadFisica": "string"
  },
  "antecedentesFamiliares": ["string"],
  "revisionSistemas": [{ "sistema": "string", "hallazgos": "string" }],
  "examenFisico": {
    "signosVitales": {
      "tensionArterial": "string",
      "frecuenciaCardiaca": "string",
      "temperatura": "string",
      "frecuenciaRespiratoria": "string",
      "saturacion": "string"
    },
    "hallazgos": {
      "general": "string",
      "cardiovascular": "string",
      "respiratorio": "string",
      "abdomen": "string",
      "neurologico": "string"
    }
  },
  "laboratorios": [{ "prueba": "string", "valor": "string", "unidad": "string", "referencia": "string", "fecha": "YYYY-MM-DD" }],
  "imagenes": [{ "estudio": "string", "fecha": "YYYY-MM-DD", "impresion": "string" }],
  "diagnostico": "string",
  "tratamiento": "string",
  "observaciones": "string",
  "seguimiento": { "fecha": "YYYY-MM-DD", "instrucciones": "string" },
  "ultimaModificacion": "ISO-8601"
}
```

## Endpoints

### GET `/api/medico/pacientes/{patientId}/historial`
- Retorna el historial clínico más reciente del paciente.
- Roles: Médico
- Respuestas:
  - 200: `ClinicalRecord`
  - 401: No autenticado
  - 403: Sin permiso (paciente no asignado)
  - 404: No encontrado

Ejemplo:
```bash
curl -H "Authorization: Bearer <token>" \
  https://sirona.local/api/medico/pacientes/1/historial
```

### PUT `/api/medico/pacientes/{patientId}/historial/{recordId}`
- Actualiza completamente el registro clínico.
- Body: `ClinicalRecord`
- Respuestas:
  - 200: `ClinicalRecord` actualizado
  - 400: Datos inválidos
  - 401/403: Seguridad
  - 404: No encontrado

### PATCH `/api/medico/pacientes/{patientId}/historial/{recordId}`
- Actualiza parcialmente campos del registro (p.ej. `diagnostico`, `tratamiento`, `observaciones`).
- Body: objeto parcial.
- Respuestas: como PUT.

## Mock (para desarrollo)

En ausencia de backend, usar estos mocks en frontend o servidor dev:

- GET devuelve `ClinicalRecord` de ejemplo (coincide con mock en `PatientRecordPage`).
- PATCH ejemplo:
```bash
curl -X PATCH \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "diagnostico": "HTA controlada",
    "tratamiento": "Continuar losartán 50 mg c/12h",
    "observaciones": "Añadir registro domiciliario de PA"
  }' \
  https://sirona.local/api/medico/pacientes/1/historial/1
```

## Seguridad
- Validar que el médico está asignado al paciente.
- Registrar auditoría en cada update.
- Redactar data sensible si no aplica.

## Notas
- Campos opcionales (unidad, referencia, seguimiento) pueden omitirse.
- Considerar versión del registro para concurrencia (ETag/If-Match).
