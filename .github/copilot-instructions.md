# Sirona - AI Coding Agent Instructions

**Sirona** is a Zero Trust medical records system (Sistema Seguro de Historiales Médicos) implementing Common Criteria security standards. This file guides AI agents on architecture, patterns, and workflows specific to this project.

## Project Architecture Overview

### Full-Stack Structure
- **Backend**: Python 3.11+ FastAPI with MongoDB (operational + audit databases)
- **Frontend**: React 19 + TypeScript + Vite with SCSS design system
- **Security Model**: Zero Trust, JWT authentication, role-based access control (RBAC), biometric templates
- **Key Roles**: Administrador, Médico, Paciente, Secretario

### Critical Data Flows
1. **Authentication Flow**: Login → JWT token + Role + MFA check → Stored in localStorage + AuthContext
2. **User Registration**: Register form → Validation → Backend creates user with `PENDIENTE_VERIFICACION` status → Facial template extraction + encryption
3. **Access Control**: Protected routes check AuthContext → get_current_user() validates JWT → require_role() enforces RBAC
4. **Audit Trail**: All sensitive actions logged to separate MongoDB audit database via AuditLog model

### Service Boundaries
- **Auth Service** (`backend/services/auth.py`): User authentication, role validation via JWT
- **Security Service** (`backend/services/security.py`): Password hashing (bcrypt, 12 rounds), JWT creation/validation, password strength validation
- **DB Service** (`backend/services/db.py`): MongoDB initialization and connection management using Beanie ODM
- **Frontend API Service** (`frontend/src/services/api.ts`): All backend HTTP calls with error handling and token injection

## Naming Conventions (Language-Specific)

### Backend (Python)
- **Files/folders**: `snake_case` (e.g., `auth_service.py`, `patient_history/`)
- **Functions/variables**: `snake_case` (e.g., `create_patient()`, `get_user_by_email()`)
- **Classes**: `PascalCase` (e.g., `UserRepository`, `AuditLogService`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `JWT_EXP_MINUTES`, `MAX_LOGIN_ATTEMPTS`)
- **Enums**: `PascalCase` values as strings (e.g., `UserRole.ADMINISTRADOR`, `UserStatus.ACTIVO`)

### Frontend (TypeScript/React)
- **Components**: `PascalCase` filenames (e.g., `LoginForm.tsx`, `PatientHistoryPage.tsx`)
- **Hooks**: `camelCase` with `use` prefix (e.g., `useAuthContext.ts`, `useRateLimitWarning.ts`)
- **Functions/variables**: `camelCase` (e.g., `handleLoginSubmit`, `isAdminRole`)
- **Folders**: `kebab-case` or lowercase (e.g., `auth/`, `patient-history/`)

## Git & Commit Conventions

### Language & Format
- **Commits, branches, technical names**: Spanish only
- **Code comments**: Spanish, focused on security decisions and design rationale
- **Format**: `<tipo>(<ámbito>): <resumen corto>` (e.g., `sec(auth): agregar rate limiting en login`)

### Commit Types
- `feat` → nueva funcionalidad
- `fix` → corrección de error
- `sec` → cambio de seguridad (MFA, encryption, rate limiting) ⭐ use for security-related changes
- `docs` → documentación
- `refactor` → cambio interno sin comportamiento nuevo
- `test` → pruebas
- `chore` → tareas de mantenimiento

## Developer Workflows

### Backend Setup & Run
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate | Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload  # Starts http://localhost:8000
```
**Key URLs**: Swagger docs: http://localhost:8000/docs | ReDoc: http://localhost:8000/redoc

### Frontend Setup & Run
```bash
cd frontend
npm install
npm run dev  # Starts http://localhost:5173
```
**Build for production**: `npm run build` (requires TypeScript check via `tsc -b`)

### Testing & Linting
- **Backend**: No pytest suite yet; manual testing via Swagger or integration tests needed
- **Frontend**: `npm run lint` (ESLint with React rules)
- **TypeScript**: Type checking required before build (`tsc -b`)

## Backend Patterns

### Model Definition (Beanie ODM + Pydantic)
**Example**: User model in [backend/models/models.py](backend/models/models.py)
- Models inherit from `Document` for MongoDB persistence
- Use `Indexed` for frequently queried fields (e.g., `email`)
- Embed sub-models using Pydantic `BaseModel` (e.g., `SecuritySettings`, `ContactoEmergencia`)
- Enums enforce constrained values (e.g., `UserRole`, `UserStatus`)
- Store sensitive data as bytes (e.g., `biometric_template: Optional[bytes]`) for encryption

### API Endpoint Structure (FastAPI Routers)
**Pattern**: Define in `routers/`, organized by resource type
- [auth.py](backend/routers/auth.py): Login, registration, MFA validation
- [patients.py](backend/routers/patients.py): Patient CRUD and medical records
- [appointments.py](backend/routers/appointments.py): Appointment scheduling

**Security**: All internal endpoints require `Depends(get_current_user)` or role-specific variants (`get_admin_user()`, `get_doctor_user()`)

### Request/Response Schemas (Pydantic)
**Location**: [backend/schemas/](backend/schemas/)
- Separate request DTOs from response models (e.g., `LoginRequest`, `LoginResponse`)
- Always include error schemas (e.g., `ErrorResponse`, `AccountLockedResponse`)
- Use `EmailStr` for email validation; Pydantic auto-validates format

### Authentication & Authorization
**Flow**:
1. Login endpoint validates credentials → issues JWT token (HS256, configurable expiry)
2. All protected endpoints use `Depends(security)` + `decode_token()`
3. Role-based access via `require_role([UserRole.MEDICO, ...])` dependency
4. Failed login attempts increment counter; 5+ attempts triggers 15-min account lockout

**Config** (`.env` required):
```
JWT_SECRET_KEY=<your_secure_key>
JWT_ALGORITHM=HS256
JWT_EXP_MINUTES=30
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
```

### Audit Logging
**Function**: `log_audit_event()` in [auth.py](backend/routers/auth.py)
- Logs authentication events (login_success, login_failed, login_blocked)
- Captures IP, user-agent, timestamp, event details
- Stored in separate `sirona_audit` MongoDB database
- **Critical for security compliance**: Never skip audit logs for sensitive actions

### Rate Limiting
**Middleware**: [backend/middleware/rate_limiter.py](backend/middleware/rate_limiter.py)
- Default: 10 requests per 60 seconds per IP
- Returns `429 Too Many Requests` when exceeded
- Configured in `main.py` via `add_middleware(RateLimitMiddleware, ...)`

### Password Security
**Function**: `validate_password_strength()` in [backend/services/security.py](backend/services/security.py)
- **Requirements**: Min 12 chars, 1 uppercase, 1 number, 1 special symbol (per FIA_SOS.1)
- **Hashing**: bcrypt with 12 rounds via `hash_password()`
- **Verification**: `verify_password()` compares hashed password
- Used in all registration endpoints

## Frontend Patterns

### Component Structure
**Example**: [frontend/src/design-system/](frontend/src/design-system/) organized by atomic design
- **atoms/**: Reusable primitives (Button, Input, Avatar, Modal)
- **molecules/**: Small components (LoginForm, PasswordStrengthIndicator, ChangePasswordModal)
- **organisms/**: Complex sections (Header, TestOrganism)
- **pages/**: Full-page components (LoginPage, ProfilePage, PatientHistoryPage)
- **layouts/**: AppLayout wraps protected routes with header + sidebar

### Authentication Context
**Location**: [frontend/src/contexts/AuthContext.tsx](frontend/src/contexts/AuthContext.tsx)
- `AuthProvider` wraps app; manages `isAuthenticated`, `user`, `token`
- `useAuth()` hook provides global auth state to any component
- Token + user data persisted in localStorage (`sirona_token`, `sirona_user`)
- Manual logout clears all auth state

### Protected Routes
**Component**: [frontend/src/components/ProtectedRoute.tsx](frontend/src/components/ProtectedRoute.tsx)
- Redirects unauthenticated users to `/login`
- Wraps routes that require `isAuthenticated === true`
- Example: `/historiales` and `/perfil` require protection

### API Communication
**Service**: [frontend/src/services/api.ts](frontend/src/services/api.ts)
- Base URL: `http://localhost:8000` (configurable via `VITE_API_URL`)
- `AuthApiService` class handles login/registration/logout
- Automatically injects `Authorization: Bearer <token>` header for authenticated requests
- Error responses parsed for account lock details (`account_locked`, `locked_until`)

### Design System & Theming
**Style System**: SCSS with token architecture in [frontend/src/styles/tokens/](frontend/src/styles/tokens/)
- **Color tokens** (`_colors.scss`): Role-based palette (Médico: `#8b7bd0`, Paciente: `#2a9d8f`, Secretario: `#E08D79`, Administrador: `#4B4237`)
- **Spacing, typography, radius, shadows**: Centralized token files
- **Module-scoped styles**: Each component has `.module.scss` (e.g., `Button.module.scss`)
- Tokens imported as TS constants (`.ts` files) for JavaScript access in components

## Integration Points & External Dependencies

### Backend Dependencies
- **FastAPI**: Web framework with async/await support
- **Beanie**: ODM for MongoDB with Pydantic integration
- **Motor**: Async MongoDB driver
- **python-jose**: JWT creation/validation (HS256)
- **bcrypt**: Password hashing with salt rounds
- **python-dotenv**: Environment variable management
- **email-validator**: Pydantic plugin for email validation
- **passlib**: Password utilities (used alongside bcrypt)

### Frontend Dependencies
- **React 19 + React Router 7**: Core UI and client-side routing
- **Vite + SWC**: Build tool with fast refresh (no React Compiler due to SWC incompatibility)
- **SCSS**: Styling with Sass-embedded
- **lucide-react**: Icon library
- **TypeScript 5.9**: Type safety

### CORS Configuration
**Backend** (`main.py`): Allows requests from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (fallback)
- `http://localhost`

### Environment Variables
**Backend** (`.env` in `backend/` directory):
```
MONGODB_URL=mongodb://localhost:27017
DB_NAME=sirona
AUDIT_DB_NAME=sirona_audit
JWT_SECRET_KEY=<secret>
JWT_ALGORITHM=HS256
JWT_EXP_MINUTES=30
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW_SECONDS=60
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
```

**Frontend**: Uses `import.meta.env.VITE_API_URL` (Vite convention); set via `.env.local`:
```
VITE_API_URL=http://localhost:8000
```

## Project-Specific Conventions

### User Status Lifecycle
Defined in `UserStatus` enum:
- `ACTIVO` → User can log in and use system
- `INACTIVO` → Account disabled but not locked
- `BLOQUEADO` → Temporary lockout due to failed login attempts
- **Missing**: `PENDIENTE_VERIFICACION` (required for facial verification workflow)

### Role-Based Color Mapping (Frontend)
- Used in badges, buttons, themed sections (not yet fully implemented)
- Map user role to primary color for visual role identification
- Example: Doctor sees violet (#8b7bd0), Patient sees teal (#2a9d8f)

### Error Response Standards
**Backend** throws HTTPException with:
- `status_code`: HTTP status (401, 403, 404, 429, etc.)
- `detail`: String message or object with additional fields (e.g., `account_locked`)

**Frontend** catches errors via `try/catch` on API calls; displays user-friendly messages

### Security-First Comments
When adding new endpoints or services:
- Document security requirements in code comments (e.g., "Requires ADMINISTRADOR role")
- Explain cryptographic decisions (e.g., "12-round bcrypt per FIA_SOS.1")
- Note audit logging calls and why they matter

## Key Files for Common Tasks

| Task | Primary Files |
|------|----------------|
| Add authentication endpoint | [backend/routers/auth.py](backend/routers/auth.py), [backend/schemas/auth_schemas.py](backend/schemas/auth_schemas.py) |
| Add new API endpoint | [backend/routers/](backend/routers/), [backend/schemas/](backend/schemas/) |
| Modify user model/roles | [backend/models/models.py](backend/models/models.py) |
| Update security policy | [backend/services/security.py](backend/services/security.py) |
| Add protected page | [frontend/src/design-system/pages/](frontend/src/design-system/pages/) + [ProtectedRoute.tsx](frontend/src/components/ProtectedRoute.tsx) |
| Style new component | [frontend/src/design-system/](frontend/src/design-system/) + `.module.scss`, reference tokens in [_colors.scss](frontend/src/styles/tokens/_colors.scss) |
| Handle API errors | [frontend/src/services/api.ts](frontend/src/services/api.ts), [frontend/src/utils/apiErrors.ts](frontend/src/utils/apiErrors.ts) |

---

**Last Updated**: January 2026 | **Language**: Spanish (commits, code comments, technical names) | **Security Focus**: Zero Trust, Common Criteria compliance, audit trails
