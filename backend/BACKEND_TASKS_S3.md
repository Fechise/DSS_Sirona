# Sprint 3

## PBI-15: Vincular Acciones de Historial a Sesión de Usuario

**Como:** administrador de auditoría
**Quiero:** que cada acción (lectura, edición) sobre un historial clínico se registre y se vincule a la sesión del usuario
**Para que:** mantener la trazabilidad y el no repudio de todas las acciones

---
### **Criterios de Aceptación (Acceptance Criteria):**

* [ ] Cuando un médico *guarda* un cambio en un historial, se debe crear un registro de auditoría.
* [ ] Cuando un usuario (médico o paciente) *abre* un historial, se debe crear un registro de auditoría.
* [ ] Dicho registro debe contener: `[ID_Usuario]`, `[Rol_Usuario]`, `[ID_Paciente_Consultado]`, `[Acción_Realizada]` y `[Timestamp]`.
* [ ] **(Nuevo)** Los registros de auditoría (logs) deben ser enviados a un servidor centralizado y configurados como inmutables (WORM - Write Once Read Many) para que nadie pueda borrarlos o modificarlos. 
* [ ] **(Nuevo)** Todos los servidores deben estar sincronizados mediante NTP seguro para garantizar la exactitud de la estampa de tiempo (Timestamp) en los logs.

Backend:
*   Estructurar el registro con: ID_Usuario, Rol_Usuario, ID_Paciente_Consultado, Acción_Realizada, Timestamp.     
*   Estandarizar valores de acción (por ejemplo: HISTORIAL_ABIERTO, HISTORIAL_EDITADO).
*   En endpoints de lectura (GET historial), generar evento de auditoría por cada acceso exitoso.   
*   Asegurar que el evento use el usuario del token y el paciente consultado.
*   En endpoints de edición (PUT/PATCH historial), generar evento de auditoría al guardar exitosamente.     
*   Registrar también fallos relevantes (403/401) si lo deciden como parte de seguridad.
*   Implementar un “Audit Logger” central que reciba eventos desde los endpoints y los envíe a un destino central (colección de auditoría separada o servicio).    
*   Garantizar que el flujo no pierda eventos (manejo de errores y reintentos básicos).

QA:
*   Configurar el destino de auditoría en un almacenamiento WORM (por ejemplo Azure Blob con políticas de inmutabilidad).
*   Documentar política de retención (tiempo de retención mínimo) y que no se permite borrado/modificación una vez escrito.
*   Definir cómo se sincroniza el tiempo de servidores/containers (NTP seguro) para que los timestamps sean consistentes.
*   Documentar el servidor NTP de referencia y el procedimiento de verificación.
*   Verificar que abrir historial genera un log con todos los campos requeridos.
*   Verificar que guardar cambios genera un log con todos los campos requeridos.
*   Verificar que los logs llegan al destino centralizado y que no se pueden modificar/borrar (según el mecanismo WORM configurado).

Frontend:
*   No mostrar detalles de auditoría al usuario final (solo mensajes funcionales).
*   Asegurar que abrir/guardar en UI invoca los endpoints correctos que disparan auditoría.

## PBI-19: Implementar HTTPS en todo el sitio

**Como:** administrador de seguridad
**Quiero:** que todo el sitio Sirona funcione bajo HTTPS por defecto
**Para que:** garantizar la confidencialidad e integridad de toda la comunicación del sistema

---
### **Criterios de Aceptación (Acceptance Criteria):**

* [ ] El servidor web debe estar configurado para redirigir automáticamente todo el tráfico `http://` a `https://`.
* [ ] El servidor debe enviar la cabecera HTTP `Strict-Transport-Security` (HSTS) para forzar al navegador a usar solo HTTPS.
* [ ] El certificado TLS debe ser válido y tener una calificación A o A+ en herramientas como SSL Labs.
* [ ] **(Nuevo)** El servidor web debe configurarse para aceptar únicamente conexiones cifradas con TLS 1.3 y suites de cifrado robustas, deshabilitando SSL y versiones antiguas de TLS.

Backend:
*   Decidir si TLS lo manejará un reverse proxy (Nginx/Traefik) o el servicio de Azure (App Service/Ingress). 
*   Documentar el punto de terminación TLS y cómo se pasan headers `X-Forwarded-*` al backend.
*   Configurar regla global para redirigir `http://` a `https://` (301/308).
*   Verificar con `curl -I http://...` que retorna redirección a HTTPS.
*   Agregar cabecera `Strict-Transport-Security` en respuestas HTTPS (con `max-age` y opcional `includeSubDomains`).
*   Validar que la cabecera solo se envía por HTTPS (no por HTTP).
*   Configurar el servidor/proxy para aceptar solo TLS 1.3 y suites robustas.     
*   Verificar que TLS 1.2/1.1/1.0/SSL no sean aceptados.
*   Configurar el backend para interpretar correctamente los headers del proxy (para URLs absolutas y redirects correctos).     
*   Evitar que el backend genere URLs `http://` cuando el tráfico real es HTTPS.

QA:
*   Instalar certificado válido (CA confiable) en el entorno de despliegue.
*   Ejecutar prueba en SSL Labs y documentar evidencia (captura o link de resultados) con calificación A/A+.
*   Confirmar que todo el sitio carga por HTTPS sin recursos HTTP (sin “mixed content”).
*   Probar que al escribir `http://` en el navegador siempre redirige a `https://` y se mantiene.

Frontend:
Nada

## PBI-20: Monitoreo de Integridad de Datos de Historiales

**Como:** administrador de seguridad
**Quiero:** que el sistema verifique la integridad de los historiales almacenados (usando hashes) y me alerte si se detecta una modificación no autorizada o corrupción
**Para que:** tomar acciones correctivas y asegurar la fiabilidad de los datos médicos 

---
### **Criterios de Aceptación (Acceptance Criteria):**

* [ ] Cuando un historial médico es *guardado* (creado o modificado), el sistema debe (re)generar un hash seguro (ej. SHA-256) de su contenido clínico y almacenarlo junto al registro.
* [ ] **(Nuevo)** La base de datos que aloja los historiales médicos debe estar configurada con Cifrado en Reposo (Encryption at Rest) utilizando el estándar AES-256, gestionando las claves en un almacén seguro separado.
* [Criterio Opcional] Se debe implementar un proceso (ej. un trabajo nocturno) que valide los hashes de los historiales.
* [ ] Si se detecta una discrepancia entre el contenido y su hash almacenado, el sistema debe:
    1.  Marcar el registro como "potencialmente corrupto".
    2.  Bloquear el acceso al registro (excepto para el Admin).
    3.  Enviar una alerta inmediata al Administrador.

Backend:
*   Definir “contenido clínico” exacto a hashear (por ejemplo: diagnóstico, notas, medicamentos; excluir metadata volátil como `updated_at`).    
*   Serializar de forma determinista (orden de campos estable) para que el hash sea reproducible.
*   En cada create/update de historial, calcular SHA-256 del contenido clínico normalizado.
*   Guardar el hash junto al registro (ej. campo `integrity_hash`) y actualizarlo en cada modificación legítima.
*   En cada GET del historial, recalcular hash y comparar con `integrity_hash`.
*   Si hay discrepancia, marcar el registro como potencialmente corrupto y disparar el flujo de bloqueo/alerta.
*   Implementar job que recorra historiales y valide hashes (diario/nocturno).
*   Registrar resultados y marcar corruptos si detecta discrepancias fuera de una operación normal.
*   Definir mecanismo de alerta (ej. log crítico + correo/cola/notificación simple).
*   Incluir en la alerta el ID del historial/paciente y timestamp, sin exponer datos clínicos completos.

QA:
*   Habilitar Encryption at Rest con AES-256 en MongoDB (según disponibilidad del entorno).
*   Gestionar claves en un almacén separado (idealmente KMS; para entorno académico, documentar la estrategia y simular si no hay soporte completo).
*   Probar flujo normal: guardar → hash se actualiza → lectura válida.
*   Probar corrupción simulada (alterar contenido en BD o mock) → detectar discrepancia → marcar corrupto → bloquear acceso (excepto Admin).
*   Verificar evidencia de cifrado en reposo según lo implementado/configurado y documentarlo.

Frontend:
*   Si el backend devuelve “registro corrupto” o 403 por corrupción, mostrar mensaje “Historial bloqueado por integridad” y ocultar datos.
*   No mostrar información residual del historial en pantalla (limpiar estado).
