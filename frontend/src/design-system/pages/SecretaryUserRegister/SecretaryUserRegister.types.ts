export type UserType = 'doctor' | 'patient';

export interface DoctorFormData {
  firstName: string;
  lastName: string;
  email: string;
  cedula: string;
  especialidad: string;
  numeroLicencia: string;
}

export interface PatientFormData {
  firstName: string;
  lastName: string;
  email: string;
  cedula: string;
  fechaNacimiento: string;
  telefonoContacto: string;
  // Campos demográficos adicionales
  direccion?: string;
  ciudad?: string;
  pais?: string;
  genero?: string;
  estadoCivil?: string;
  ocupacion?: string;
  grupoSanguineo?: string;
}
