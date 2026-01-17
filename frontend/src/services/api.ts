// Base de la API: permite vacío para usar proxy "/api" en desarrollo
const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'https://sirona-api.ecuconsult.net').replace(/\/+$/, '');

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;  // Cambio: era access_token
  role: string;
  requires_mfa: boolean;  // Cambio: era mfa_required
  user?: {
    email: string;
    fullName: string;
    cedula: string;
    role: string;
    status: string;
  };
}

export interface ApiError {
  detail: string;
  account_locked?: boolean;
  locked_until?: string;
}

export class AuthApiService {
  /**
   * Login con email y contraseña
   */
  static async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      
      console.log('Response status:', response.status);
      console.log('Response data:', responseData);

      if (!response.ok) {
        throw responseData;
      }

      return responseData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Verificar código OTP para MFA
   */
  static async verifyOtp(email: string, otp: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const responseData = await response.json();
      
      console.log('OTP Response:', responseData);

      if (!response.ok) {
        throw responseData;
      }

      return responseData;
    } catch (error) {
      console.error('OTP error:', error);
      throw error;
    }
  }

  /**
   * Registrar un nuevo doctor (solo Secretarios)
   */
  static async registerDoctor(token: string, data: any): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/auth/register-doctor`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw responseData;
    }

    return responseData;
  }

  /**
   * Registrar un nuevo paciente (solo Secretarios)
   */
  static async registerPatient(token: string, data: any): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/auth/register-patient`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw responseData;
    }

    return responseData;
  }
}

// ============================================================
// PATIENT SERVICES
// ============================================================

export interface PatientHistoryItem {
  id: string;
  fecha: string;
  medico: string;
  tipo: string;
  descripcion: string;
  diagnostico?: string;
  medicamentos?: string[];
}

export interface MedicoAsignado {
  nombre: string;
  especialidad: string;
  telefono: string;
}

export interface ContactoEmergencia {
  nombre: string;
  relacion: string;
  telefono: string;
}

export interface Consulta {
  id: string;
  fecha: string;
  motivo: string;
  diagnostico: string;
  tratamiento: string;
  notasMedico: string;
}

export interface Vacuna {
  nombre: string;
  fecha: string;
  proximaDosis?: string;
}

export interface ProximaCita {
  fecha: string;
  motivo: string;
  medico: string;
}

export interface PatientHistoryResponse {
  id: string;
  tipoSangre: string;
  alergias: string[];
  condicionesCronicas: string[];
  medicamentosActuales: string[];
  medicoAsignado: MedicoAsignado;
  contactoEmergencia: ContactoEmergencia;
  consultas: Consulta[];
  vacunas: Vacuna[];
  antecedentesFamiliares: string[];
  proximaCita?: ProximaCita;
  ultimaModificacion: string;
}

export interface PatientInfo {
  id: string;
  fullName: string;
  email: string;
  cedula: string;
  fechaNacimiento?: string;
  telefonoContacto?: string;
  status: string;
}

export interface PatientListResponse {
  total?: number;
  patients: PatientInfo[];
}

export class PatientApiService {
  /**
   * Obtener historial del paciente actual
   */
  static async getMyHistory(token: string): Promise<PatientHistoryResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/paciente/mi-historial`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching patient history:', error);
      throw error;
    }
  }

  /**
   * Obtener citas del paciente autenticado
   */
  static async getMyAppointments(token: string, estado?: string): Promise<AppointmentResponse[]> {
    const params = estado ? `?estado=${estado}` : '';
    const response = await fetch(`${API_BASE_URL}/api/patient/my-appointments${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return response.json();
  }

  /**
   * Obtener lista de pacientes (para Secretario/Admin)
   */
  static async getPatientsList(token: string): Promise<PatientListResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/paciente/listado-pacientes`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching patients list:', error);
      throw error;
    }
  }
}

// ============================================================
// APPOINTMENT INTERFACES
// ============================================================

export interface AppointmentResponse {
  id: string;
  patient_id: string;
  patientName: string;
  doctor_id: string;
  doctorName: string;
  fecha: string;
  motivo: string;
  estado: string;
  notas?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAppointmentRequest {
  patient_id: string;
  doctor_id: string;
  fecha: string;
  motivo: string;
  notas?: string;
}

export interface UpdateAppointmentRequest {
  fecha?: string;
  motivo?: string;
  estado?: string;
  notas?: string;
}

export interface DoctorInfo {
  id: string;
  fullName: string;
  email: string;
  especialidad: string;
  status: string;
}

export interface DoctorAvailability {
  id: string;
  doctor_id: string;
  doctorName: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  duracionCita: number;
  activo: boolean;
  created_at: string;
}

export interface AvailableSlot {
  fecha: string;
  disponible: boolean;
}

export interface DoctorScheduleResponse {
  doctor_id: string;
  doctorName: string;
  fecha: string;
  slots: AvailableSlot[];
}

export interface CreateAvailabilityRequest {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  duracionCita: number;
}

export interface PatientMinimalInfo {
  id: string;
  fullName: string;
  email: string;
  cedula: string;
  fechaNacimiento?: string;
  telefonoContacto?: string;
}

export interface DoctorAssignedPatient {
  id: string;
  fullName: string;
  email: string;
  cedula: string;
  fechaNacimiento?: string;
  ultimaConsulta?: string;
  diagnosticos?: number;
  condicionesCronicas?: string[];
}

// Helper function for authenticated requests
async function authenticatedFetch(url: string, token: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw error;
  }

  return response.json();
}

// ============================================================
// APPOINTMENT SERVICE
// ============================================================

export class AppointmentApiService {
  /**
   * Crear una nueva cita (solo Secretarios)
   */
  static async createAppointment(token: string, data: CreateAppointmentRequest): Promise<AppointmentResponse> {
    return authenticatedFetch(`${API_BASE_URL}/api/appointments`, token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Listar citas con filtros opcionales (solo Secretarios)
   */
  static async listAppointments(
    token: string,
    filters?: { patient_id?: string; doctor_id?: string; estado?: string }
  ): Promise<AppointmentResponse[]> {
    const params = new URLSearchParams();
    if (filters?.patient_id) params.append('patient_id', filters.patient_id);
    if (filters?.doctor_id) params.append('doctor_id', filters.doctor_id);
    if (filters?.estado) params.append('estado', filters.estado);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/api/appointments${queryString ? `?${queryString}` : ''}`;

    return authenticatedFetch(url, token);
  }

  /**
   * Listar citas del doctor autenticado (solo Médicos)
   */
  static async getDoctorAppointments(token: string, estado?: string): Promise<AppointmentResponse[]> {
    const params = estado ? `?estado=${estado}` : '';
    return authenticatedFetch(`${API_BASE_URL}/api/doctor/my-appointments${params}`, token);
  }

  /**
   * Obtener una cita por ID (solo Secretarios)
   */
  static async getAppointment(token: string, appointmentId: string): Promise<AppointmentResponse> {
    return authenticatedFetch(`${API_BASE_URL}/api/appointments/${appointmentId}`, token);
  }

  /**
   * Actualizar una cita (solo Secretarios)
   */
  static async updateAppointment(token: string, appointmentId: string, data: UpdateAppointmentRequest): Promise<AppointmentResponse> {
    return authenticatedFetch(`${API_BASE_URL}/api/appointments/${appointmentId}`, token, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Eliminar una cita (solo Secretarios)
   */
  static async deleteAppointment(token: string, appointmentId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw data;
    }
  }

  /**
   * Listar médicos disponibles para citas
   */
  static async listDoctors(token: string): Promise<DoctorInfo[]> {
    return authenticatedFetch(`${API_BASE_URL}/api/doctors`, token);
  }

  /**
   * Alias para listDoctors (compatibilidad)
   */
  static async getDoctors(token: string): Promise<DoctorInfo[]> {
    return this.listDoctors(token);
  }

  /**
   * Alias para listAppointments (compatibilidad)
   */
  static async getAppointments(token: string, filters?: { patient_id?: string; doctor_id?: string; estado?: string }): Promise<AppointmentResponse[]> {
    return this.listAppointments(token, filters);
  }

  /**
   * Obtener disponibilidad de un médico
   */
  static async getDoctorAvailability(token: string, doctorId: string, fecha?: string): Promise<DoctorAvailability[]> {
    const params = fecha ? `?fecha=${fecha}` : '';
    return authenticatedFetch(`${API_BASE_URL}/api/doctors/${doctorId}/availability${params}`, token);
  }

  /**
   * Obtener horario de un médico (slots disponibles)
   */
  static async getDoctorSchedule(token: string, doctorId: string, fecha: string): Promise<DoctorScheduleResponse> {
    return authenticatedFetch(`${API_BASE_URL}/api/doctors/${doctorId}/schedule?fecha=${fecha}`, token);
  }

  /**
   * Crear disponibilidad para un médico
   */
  static async createDoctorAvailability(token: string, doctorId: string, data: CreateAvailabilityRequest): Promise<DoctorAvailability> {
    return authenticatedFetch(`${API_BASE_URL}/api/doctors/${doctorId}/availability`, token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// ============================================================
// ADMIN INTERFACES
// ============================================================

export interface AuditLogEntry {
  id: string;
  event: string;
  user_email: string;
  user_id: string;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface AuditLogsResponse {
  total: number;
  logs: AuditLogEntry[];
}

export interface UserListItem {
  id: string;
  fullName: string;
  email: string;
  cedula: string;
  role: string;
  status: string;
  created_at: string;
  last_login?: string;
  especialidad?: string;
  numeroLicencia?: string;
  departamento?: string;
  telefonoContacto?: string;
  fechaNacimiento?: string;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  genero?: string;
  estadoCivil?: string;
  ocupacion?: string;
  grupoSanguineo?: string;
}

export interface UsersListResponse {
  total: number;
  users: UserListItem[];
}

// ============================================================
// DOCTOR SELF-SERVICE
// ============================================================

export class DoctorApiService {
  /**
   * Obtener disponibilidad del médico actual
   */
  static async getMyAvailability(token: string): Promise<DoctorAvailability[]> {
    return authenticatedFetch(`${API_BASE_URL}/api/doctor/my-availability`, token);
  }

  /**
   * Crear disponibilidad para el médico actual
   */
  static async createMyAvailability(token: string, data: CreateAvailabilityRequest): Promise<DoctorAvailability> {
    return authenticatedFetch(`${API_BASE_URL}/api/doctor/my-availability`, token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Actualizar disponibilidad del médico actual
   */
  static async updateMyAvailability(token: string, availabilityId: string, data: CreateAvailabilityRequest): Promise<DoctorAvailability> {
    return authenticatedFetch(`${API_BASE_URL}/api/doctor/my-availability/${availabilityId}`, token, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Activar/desactivar disponibilidad
   */
  static async toggleMyAvailability(token: string, availabilityId: string): Promise<DoctorAvailability> {
    return authenticatedFetch(`${API_BASE_URL}/api/doctor/my-availability/${availabilityId}/toggle`, token, {
      method: 'PATCH',
    });
  }

  /**
   * Eliminar disponibilidad
   */
  static async deleteMyAvailability(token: string, availabilityId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/doctor/my-availability/${availabilityId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw data;
    }
  }

  /**
   * Obtener citas del médico actual
   */
  static async getMyAppointments(token: string, estado?: string): Promise<AppointmentResponse[]> {
    const params = estado ? `?estado=${estado}` : '';
    return authenticatedFetch(`${API_BASE_URL}/api/doctor/my-appointments${params}`, token);
  }

  /**
   * Completar/cerrar una cita con notas
   */
  static async completeAppointment(token: string, appointmentId: string, notas?: string): Promise<AppointmentResponse> {
    const params = notas ? `?notas=${encodeURIComponent(notas)}` : '';
    return authenticatedFetch(`${API_BASE_URL}/api/doctor/appointments/${appointmentId}/complete${params}`, token, {
      method: 'PATCH',
    });
  }

  /**
   * Obtener pacientes asignados al médico
   */
  static async getMyPatients(token: string): Promise<{ pacientes: DoctorAssignedPatient[] }> {
    return authenticatedFetch(`${API_BASE_URL}/api/doctor/my-patients`, token);
  }

  /**
   * Obtener historial de un paciente específico
   */
  static async getPatientHistory(token: string, patientId: string): Promise<PatientHistoryResponse> {
    return authenticatedFetch(`${API_BASE_URL}/api/paciente/pacientes/${patientId}/historial`, token);
  }

  /**
   * Crear historial para un paciente
   */
  static async createPatientHistory(token: string, patientId: string): Promise<PatientHistoryResponse> {
    return authenticatedFetch(`${API_BASE_URL}/api/paciente/pacientes/${patientId}/historial`, token, {
      method: 'POST',
    });
  }

  /**
   * Actualizar historial de un paciente
   */
  static async updatePatientHistory(token: string, patientId: string, data: {
    alergias?: string[];
    condicionesCronicas?: string[];
    medicamentosActuales?: string[];
    antecedentesFamiliares?: string[];
  }): Promise<PatientHistoryResponse> {
    return authenticatedFetch(`${API_BASE_URL}/api/paciente/pacientes/${patientId}/historial`, token, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Agregar consulta a un paciente
   */
  static async addConsultation(token: string, patientId: string, data: {
    motivo: string;
    diagnostico: string;
    tratamiento: string;
    notasMedico: string;
  }): Promise<unknown> {
    return authenticatedFetch(`${API_BASE_URL}/api/paciente/pacientes/${patientId}/consultas`, token, {
      method: 'POST',
      body: JSON.stringify({ patient_id: patientId, ...data }),
    });
  }
}

// ============================================================
// ADMIN SERVICES
// ============================================================

export interface CreateUserRequest {
  email: string;
  fullName: string;
  cedula: string;
  // role se establece automáticamente como 'Secretario' en el servicio
  especialidad?: string;
  numeroLicencia?: string;
  departamento?: string;
  telefonoContacto?: string;
  fechaNacimiento?: string;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  genero?: string;
  estadoCivil?: string;
  ocupacion?: string;
  grupoSanguineo?: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  role?: string;
  status?: string;
  especialidad?: string;
  numeroLicencia?: string;
  departamento?: string;
  telefonoContacto?: string;
}

export interface UpdateUserRoleRequest {
  role: string;
}

export class AdminApiService {
  /**
   * Obtener logs de auditoría (solo Administradores)
   */
  static async getAuditLogs(
    token: string, 
    skip: number = 0, 
    limit: number = 50,
    eventType?: string,
    userEmail?: string
  ): Promise<AuditLogsResponse> {
    const params = new URLSearchParams();
    params.append('offset', skip.toString());
    params.append('limit', limit.toString());
    if (eventType) params.append('event_type', eventType);
    if (userEmail) params.append('user_email', userEmail);
    
    return authenticatedFetch(`${API_BASE_URL}/api/admin/audit/logs?${params.toString()}`, token);
  }

  /**
   * Obtener tipos de eventos de auditoría
   */
  static async getAuditEventTypes(token: string): Promise<{ event_types: string[] }> {
    return authenticatedFetch(`${API_BASE_URL}/api/admin/audit/events`, token);
  }

  /**
   * Listar todos los secretarios del sistema
   */
  static async listUsers(
    token: string,
    filters?: {
      status?: string;
      search?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<UsersListResponse> {
    const params = new URLSearchParams();
    // Siempre filtrar por rol Secretario
    params.append('role', 'Secretario');
    if (filters?.status) params.append('status_filter', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    const url = `${API_BASE_URL}/api/admin/users${queryString ? `?${queryString}` : ''}`;

    return authenticatedFetch(url, token);
  }

  /**
   * Obtener un secretario específico
   */
  static async getUser(token: string, userId: string): Promise<UserListItem> {
    return authenticatedFetch(`${API_BASE_URL}/api/admin/users/${userId}`, token);
  }

  /**
   * Crear un nuevo secretario
   */
  static async createUser(token: string, data: CreateUserRequest): Promise<UserListItem> {
    // Forzar rol de Secretario
    const secretaryData = { ...data, role: 'Secretario' };
    return authenticatedFetch(`${API_BASE_URL}/api/admin/users`, token, {
      method: 'POST',
      body: JSON.stringify(secretaryData),
    });
  }

  /**
   * Actualizar un secretario existente
   */
  static async updateUser(
    token: string,
    userId: string,
    data: UpdateUserRequest
  ): Promise<UserListItem> {
    return authenticatedFetch(`${API_BASE_URL}/api/admin/users/${userId}`, token, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Cambiar el rol de un usuario (no usado en gestión de secretarios)
   */
  static async updateUserRole(
    token: string,
    userId: string,
    data: UpdateUserRoleRequest
  ): Promise<UserListItem> {
    return authenticatedFetch(`${API_BASE_URL}/api/admin/users/${userId}/role`, token, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Desactivar un secretario
   */
  static async deactivateUser(token: string, userId: string): Promise<{ message: string }> {
    return authenticatedFetch(`${API_BASE_URL}/api/admin/users/${userId}`, token, {
      method: 'PUT',
      body: JSON.stringify({ status: 'Inactivo' }),
    });
  }

  /**
   * Reactivar un secretario
   */
  static async reactivateUser(token: string, userId: string): Promise<{ message: string }> {
    return authenticatedFetch(`${API_BASE_URL}/api/admin/users/${userId}`, token, {
      method: 'PUT',
      body: JSON.stringify({ status: 'Activo' }),
    });
  }
}