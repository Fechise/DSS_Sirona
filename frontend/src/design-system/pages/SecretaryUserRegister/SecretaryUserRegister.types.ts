export type UserType = 'doctor' | 'patient';

export interface DoctorFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  cedula: string;
  especialidad: string;
  numeroLicencia: string;
}

export interface PatientFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  cedula: string;
  fechaNacimiento: string;
  telefonoContacto: string;
}
