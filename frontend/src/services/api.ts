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
   * Login con reconocimiento facial
   */
  static async loginWithFace(email: string, faceImage: File): Promise<LoginResponse> {
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('face_image', faceImage);

      const response = await fetch(`${API_BASE_URL}/api/auth/login/face`, {
        method: 'POST',
        body: formData,
      });

      const responseData = await response.json();
      
      console.log('Face login response:', responseData);

      if (!response.ok) {
        throw responseData;
      }

      return responseData;
    } catch (error) {
      console.error('Face login error:', error);
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

export interface PatientHistoryResponse {
  paciente_id: string;
  nombre: string;
  apellido: string;
  email: string;
  cedula: string;
  historial: PatientHistoryItem[];
}

export interface PatientInfo {
  id: string;
  fullName: string;
  email: string;
  cedula: string;
  status: string;
  role: string;
  created_at: string;
}

export interface PatientListResponse {
  total: number;
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
   * Obtener disponibilidad de un médico
   */
  static async getDoctorAvailability(token: string, doctorId: string, fecha?: string): Promise<DoctorAvailability[]> {
    const params = fecha ? `?fecha=${fecha}` : '';
    return authenticatedFetch(`${API_BASE_URL}/api/doctors/${doctorId}/availability${params}`, token);
  }

  /**
   * Obtener horario de un médico (slots disponibles)
   */
  static async getDoctorSchedule(token: string, doctorId: string, fecha: string): Promise<AvailableSlot[]> {
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

// ============================================================
// ADMIN SERVICE
// ============================================================

export class AdminApiService {
  /**
   * Obtener logs de auditoría (solo Administradores)
   */
  static async getAuditLogs(token: string, skip: number = 0, limit: number = 50): Promise<AuditLogsResponse> {
    return authenticatedFetch(`${API_BASE_URL}/api/admin/audit-logs?skip=${skip}&limit=${limit}`, token);
  }
}