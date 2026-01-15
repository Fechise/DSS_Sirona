# Sprint 2

## PBI-12: Acceso a Historial Médico (Rol Médico)
**Como:** Médico
**Quiero:** poder ver y editar únicamente los historiales de los pacientes que tengo asignados
**Para que:** cumplir con la política de control de acceso y proteger la confidencialidad de la información clínica.

---
### **Criterios de Aceptación (Acceptance Criteria):**

* [ ] Al iniciar sesión, el médico solo ve en su panel a los pacientes que le han sido asignados.
* [ ] El médico puede abrir, ver y modificar (ej. añadir diagnóstico) los historiales de sus pacientes asignados.
* [ ] Si el médico intenta acceder al historial de un paciente no asignado (ej. manipulando la URL), el sistema debe denegar el acceso.

Backend:
*   Crear endpoint que retorne solo los pacientes asignados al `doctor_id` del token.
*   No aceptar `doctor_id` por query/body para evitar manipulación (usar identidad del JWT).
*   Responder 401 si no hay sesión y 403 si el rol no es Médico.
*   Implementar `GET /historiales/{patient_id}`.
*   Validar que el usuario tenga rol Médico y que `patient_id` pertenezca a su lista de asignados.
*   Si intenta acceder a un paciente no asignado, devolver 403 (no filtrar información sensible).
*   Implementar `PUT/PATCH /historiales/{patient_id}` para añadir diagnóstico u otros campos permitidos.
*   Validar rol Médico y asignación antes de modificar.
*   Validar input (campos permitidos) para evitar cambios indebidos.

Frontend:
*   Crear vista del panel que consuma el endpoint de “pacientes asignados”.
*   Mostrar lista/tabla de pacientes asignados y links a su historial.
*   Implementar pantalla de historial con lectura (GET) y edición (PUT/PATCH).
*   Manejar errores 401/403 mostrando mensaje de acceso denegado y redirigir si la sesión expira.

## PBI-13: Acceso a Historial Médico (Rol Paciente)
**Como:** Paciente
**Quiero:** poder ver mi propio historial clínico en modo de solo lectura, pero no poder editarlo
**Para que:** consultar mi información sin poder alterarla accidentalmente.

---
### **Criterios de Aceptación (Acceptance Criteria):**

* [ ] El paciente puede acceder a una sección "Mi Historial".
* [ ] Todos los campos del historial deben mostrarse como "solo lectura" (read-only).
* [ ] No debe existir ningún botón de "Guardar" o "Editar" para el paciente.
* [ ] El paciente no puede, bajo ninguna circunstancia, ver el historial de otro paciente.

Backend:
*   Implementar endpoint tipo GET para “Mi Historial” que use el `patient_id` del token (no recibir `patient_id` por URL/query).
*   Validar que el rol sea Paciente y devolver 403 si no corresponde.
*   Asegurar que endpoints de actualización (PUT/PATCH/DELETE) no permitan operaciones para rol Paciente (403).
*   Validar también que un paciente no pueda enviar payloads “maliciosos” para editar por rutas no destinadas.

Frontend:
*   Crear ruta/página “Mi Historial” visible solo para usuarios con rol Paciente.     
*   Consumir el endpoint de “mi historial” y mostrar los campos clínicos.
*   Renderizar los datos como texto/inputs deshabilitados; sin botones Editar/Guardar.
*   Confirmar que no existan componentes reutilizados de edición en esta vista.
*   Si el backend devuelve 401, redirigir a login.
*   Si devuelve 403, mostrar “Acceso denegado” sin filtrar detalles.

## PBI-14: Protección de Información Residual entre Consultas
**Como:** Médico
**Quiero:** que al cambiar de la vista del historial del 'Paciente A' al 'Paciente B', el sistema borre todos los datos del 'Paciente A'
**Para que:** prevenir que la información sensible se filtre entre consultas en una misma sesión 

---
### **Criterios de Aceptación (Acceptance Criteria):**

* [ ] Al navegar desde `/historial/1` a `/historial/2`, la aplicación debe recargar completamente los datos del Paciente B.
* [ ] Los objetos de la aplicación (variables, estado) que contenían datos del Paciente A deben ser limpiados o destruidos.
* [ ] No debe quedar información (ej. nombre, cédula, diagnóstico) del Paciente A visible en ningún componente de la interfaz al ver al Paciente B.

Backend:
*   Asegurar que el endpoint de historial valida asignación/propiedad (médico-paciente) para cada request.        
*   Esto evita que el frontend sea la única barrera ante manipulación de rutas en una SPA.

Frontend:
*   En la página de historial, leer el parámetro de ruta (ej. `patientId`).     
*   Disparar un fetch nuevo cada vez que cambie `patientId` (dependencia en `useEffect`).      
*   Evitar “cache” accidental de datos del paciente anterior.
*   En el `useEffect`, implementar función de cleanup que resetee a `null`/estado vacío: nombre, cédula, diagnóstico, formulario, etc.
*   Cancelar o ignorar respuestas tardías (race condition) para que no sobreescriban el estado del paciente nuevo (patrón `isCurrent` o abort controller).
*   Al detectar cambio de `patientId`, mostrar un estado “Cargando…” y ocultar campos hasta que llegue el nuevo fetch. 
*   Confirmar que no queda texto del Paciente A renderizado mientras se carga Paciente B.
*   No guardar en `localStorage/sessionStorage` datos clínicos del paciente (solo token de sesión).
*   Si se estaba guardando algo por debug, eliminarlo y documentarlo.

## PBI-16: Acceso a Citas (Rol Secretario)
**Como:** Secretario
**Quiero:** poder crear, ver y gestionar las citas de todos los pacientes y médicos, pero no poder acceder a la sección de 'Historial Clínico'
**Para que:** cumplir con mi trabajo sin violar la confidencialidad de los datos médicos

---
### **Criterios de Aceptación (Acceptance Criteria):**

* [ ] El usuario 'Secretario' puede acceder al módulo de "Agendamiento".
* [ ] El usuario 'Secretario' puede ver datos demográficos (nombre, teléfono) del paciente para agendar la cita.
* [ ] Si el usuario 'Secretario' intenta acceder a la URL `/historial/...`, el sistema debe mostrar un error 403 (Acceso Denegado).
* [ ] La interfaz del Secretario no debe tener enlaces visibles a los historiales clínicos.

Backend:
*   Definir/confirmar reglas de autorización: Secretario puede gestionar citas y ver datos demográficos mínimos.
*   Asegurar que no exista acceso a endpoints de historial clínico con rol Secretario.
*   Crear endpoint que retorne solo nombre y teléfono (y el identificador necesario) para agendamiento.        
*   Evitar retornar diagnóstico, notas clínicas u otros campos sensibles.
*   Implementar crear, ver, editar y cancelar citas para médicos y pacientes.    
*   Proteger endpoints para rol Secretario (y Admin si aplica).
*   Asegurar que `GET/PUT/PATCH /historiales/...` valide rol y devuelva 403 si es Secretario.
*   Probar también acceso directo por URL y por llamadas a API.

Frontend:
*   Crear sección/página de Agendamiento en el menú del Secretario. 
*   Proteger ruta por rol para que otros roles no vean esta UI si no corresponde.
*   Mostrar lista de pacientes con nombre y teléfono. 
*   Formularios para crear/editar citas (fecha, hora, médico, paciente).
*   Asegurar que no haya botones/links a historiales en menús, tablas o vistas del Secretario.  
*   Si se reutilizan componentes, deshabilitar acciones de “ver historial” para Secretario.

## PBI-17: Conexión Segura con Pasarela de Pagos
**Como:** Paciente
**Quiero:** que la conexión entre Sirona y la Pasarela de Pagos sea por HTTPS
**Para que:** asegurar que los datos de mi transacción no puedan ser leídos (confidencialidad) ni modificados (integridad) por un atacante

---
### **Criterios de Aceptación (Acceptance Criteria):**

* [ ] Todas las llamadas API desde el backend de Sirona a la Pasarela de Pagos externa deben usar `https://`.
* [ ] Todas las redirecciones del navegador del usuario a la Pasarela de Pagos deben usar `https://`.
* [ ] La comunicación debe fallar si el certificado TLS de la pasarela no es válido.
* [ ] **(Nuevo)** La conexión debe forzar el uso exclusivo de TLS 1.3, rechazando cualquier negociación con protocolos anteriores (TLS 1.2 o inferiores) para evitar ataques de degradación (downgrade attacks).

Backend:
*   Asegurar que todas las URLs a pasarela usen `https://` (no permitir `http://` ni URLs configurables sin validación).
*   Mantener `verify` habilitado (validación de certificado + hostname) y fallar si el certificado no es válido.
*   Configurar un `SSLContext` de cliente para permitir solo TLS 1.3 (deshabilitar TLS 1.2 e inferiores).
*   Integrar ese contexto en el cliente HTTP que usen (requests/httpx/aiohttp según su implementación) y documentar limitaciones del entorno.
*   Crear endpoint que genere la orden/transaction_id y retorne la URL HTTPS de la pasarela o el token de redirección.    
*   Validar que la URL de redirección sea siempre `https://` (lista blanca de dominio de pasarela si aplica).

Frontend:
*   En el flujo de pago, redirigir solo a la URL HTTPS recibida del backend.        
*   Validar en frontend que si la URL no empieza con `https://` se bloquee y se muestre error.
*   Si el backend reporta error de conexión TLS/certificado (ej. timeout, verify failed), mostrar mensaje de error de pago genérico y no exponer detalles sensibles.
