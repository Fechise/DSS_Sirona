# Sirona - Sistema Seguro de Historiales Médicos

Sirona es un sistema de historiales médicos basado en principios de **Zero Trust** y requisitos de **Common Criteria**, diseñado para proteger la información de médicos, pacientes, secretarios y administradores.

## Tecnologías

- Backend: **Python + FastAPI**
- Frontend: **React + TypeScript (Vite, SWC)**
- Base de datos: **MongoDB** (operativa y de auditoría separadas)
- Control de versiones: **Git en Azure DevOps**

---

## Cómo empezar

### Requisitos

- Python 3.11+
- Node.js 18+
- Git
- Docker (opcional, para MongoDB y despliegue)

### Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd sirona
```

### Configurar remotos Git (Azure DevOps + GitHub)

Este proyecto sincroniza automáticamente con **Azure DevOps** y **GitHub**. Después de clonar, ejecuta:

**Windows (PowerShell):**
```powershell
.\setup-git-remotes.ps1
```

**Linux/Mac:**
```bash
chmod +x setup-git-remotes.sh
./setup-git-remotes.sh
```

Esto configurará push dual para que `git push origin` suba a ambos repositorios simultáneamente.

### Ejecutar backend (FastAPI)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate # En Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Ejecutar frontend (React)

```bash
cd frontend
npm install
npm run dev
```

---

## Estándares de nombres

### Backend (Python / FastAPI)

- **Archivos y carpetas:** `snake_case`  
  - Ejemplos: `auth_service.py`, `patient_history/`, `audit_repository.py`
- **Funciones y variables:** `snake_case`  
  - Ejemplos: `crear_paciente()`, `obtener_usuario_por_email()`
- **Clases:** `PascalCase`  
  - Ejemplos: `UserRepository`, `AuditLogService`
- **Constantes:** `UPPER_SNAKE_CASE`  
  - Ejemplos: `JWT_EXP_MINUTES`, `RATE_LIMIT_PER_MIN`

### Frontend (React / TypeScript)

- **Componentes (archivos):** `PascalCase`  
  - Ejemplos: `LoginForm.tsx`, `PatientHistoryPage.tsx`
- **Hooks personalizados:** `camelCase` y comienzan con `use`  
  - Ejemplos: `useAuthContext.ts`, `useRateLimitWarning.ts`
- **Funciones y variables normales:** `camelCase`  
  - Ejemplos: `handleLoginSubmit`, `isAdminRole`
- **Carpetas de módulos:** `kebab-case` o minúsculas  
  - Ejemplos: `auth/`, `patient-history/`, `admin-dashboard/`

---

## Convenciones de Git y commits

### Idioma

- **Commits, ramas y nombres técnicos: en español.**
- Comentarios en código también en español, centrados en explicar decisiones de seguridad y diseño.

### Formato de mensajes de commit

Usar el formato:

```
<tipo>(<ámbito>): <resumen corto en español>
```

**Tipos recomendados:**

- `feat`   → nueva funcionalidad
- `fix`    → corrección de error
- `sec`    → cambio de seguridad (MFA, TLS, cifrado, rate limiting)
- `docs`   → documentación
- `refactor` → cambio interno sin cambiar comportamiento
- `test`   → pruebas
- `chore`  → tareas de mantenimiento (configuración, formateo, etc.)

**Ámbitos sugeridos:**

- `backend`, `frontend`, `auth`, `auditoria`, `db`, `devops`, `infra`

**Ejemplos:**

```
feat(auth): agregar flujo de mfa con prueba de vida
sec(gateway): aplicar rate limiting al endpoint de login
fix(frontend): corregir manejo de token jwt expirado
docs(readme): documentar estándares de nombres y commits
chore(devops): actualizar archivos gitignore de python y node
test(auth): añadir pruebas unitarias para política de contraseñas
```

---

## Estrategia de ramas

- Rama principal: `main`  
  - Siempre estable, lista para despliegue.  
  - Sin pushes directos: solo merges por Pull Request.

- Ramas de feature por PBI (Product Backlog Item):

```
feature/PBI-3-auth-mfa
feature/PBI-5-rate-limiting
feature/PBI-10-logs-worm
feature/PBI-15-cifrado-bd
```

- Opcional: ramas de corrección urgente:

```
hotfix/error-login
```

---

## Build y pruebas

### Backend

```bash
cd backend
pytest # Pruebas automáticas
ruff . # Linter / estilo (si se configura)
```

### Frontend

```bash
cd frontend
npm run lint
npm run test # Si se configuran pruebas
```

---

## Contribuir (equipo interno)

1. Crear rama desde `main` siguiendo la convención (`feature/...` o `hotfix/...`).
2. Implementar cambios respetando los estándares de nombres y seguridad.
3. Ejecutar pruebas (backend y/o frontend).
4. Crear Pull Request en Azure DevOps:
   - Descripción clara.
   - Referencia al PBI (ej.: `PBI-3`).
5. Esperar revisión de al menos 1 integrante del equipo antes de hacer merge.

---

## Seguridad

- Todas las APIs deben usar **TLS 1.3** en entornos de despliegue.
- Autenticación con **MFA** para administradores y accesos desde redes no confiables.
- **Rate limiting** en el Gateway para mitigar ataques de fuerza bruta/DoS.
- Logs de auditoría enviados a almacenamiento **WORM**.
- Base de datos de historiales cifrada en reposo con **AES-256**.
