const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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