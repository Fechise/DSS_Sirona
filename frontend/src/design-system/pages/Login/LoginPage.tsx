import React, { useState } from 'react';
import styles from './LoginPage.module.scss';
import { LoginForm } from '../../molecules/LoginForm/LoginForm';
import { ShieldCheck, AlertCircle, Mail, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../atoms/Button/Button';
import { Input } from '../../atoms/Input/Input';
import { FaceCameraCapture } from '../../atoms/FaceCameraCapture/FaceCameraCapture';
import { Link } from '../../atoms/Link/Link';
import { AuthApiService } from '../../../services/api';
import { BackgroundBlobs } from './BackgroundBlobs';

export const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [modo, setModo] = useState<'password' | 'face'>('password');
  const [faceEmail, setFaceEmail] = useState('');
  const [faceCapture, setFaceCapture] = useState<File | null>(null);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [otp, setOtp] = useState('');
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [accountLocked, setAccountLocked] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handlePasswordSubmit = async (data: { email: string; password: string }) => {
    setLoading(true);
    setAccountLocked(false);
    setErrorMessage(null);

    try {
      const response = await AuthApiService.login(data);

      console.log('Login response:', response); // Debug

      if (response.requires_mfa) {
        setMfaRequired(true);
        setPendingEmail(data.email);
      } else {
        // Usar el email del formulario y el token de la respuesta
        login(data.email, response.token, response.role, data.email.split('@')[0]);
        navigate('/inicio');
      }
    } catch (error: any) {
      console.error('Login failed:', error); // Debug
      if (error.account_locked) {
        setAccountLocked(true);
        setErrorMessage(`Cuenta bloqueada hasta ${error.locked_until || '15 minutos'}`);
      } else {
        setErrorMessage(error.detail || 'Error al iniciar sesión. Verifica tus credenciales.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAccountLocked(false);
    setErrorMessage(null);

    try {
      if (!faceCapture) {
        setErrorMessage('Debes capturar tu rostro para continuar');
        return;
      }

      const response = await AuthApiService.loginWithFace(faceEmail, faceCapture);

      if (response.requires_mfa) {
        setMfaRequired(true);
        setPendingEmail(faceEmail);
      } else {
        login(faceEmail, response.token, response.role, faceEmail.split('@')[0]);
        navigate('/inicio');
      }
    } catch (error: any) {
      if (error.account_locked) {
        setAccountLocked(true);
        setErrorMessage(`Cuenta bloqueada hasta ${error.locked_until || '15 minutos'}`);
      } else {
        setErrorMessage(error.detail || 'Error en reconocimiento facial. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await AuthApiService.verifyOtp(pendingEmail!, otp);

      login(pendingEmail!, response.token, response.role, pendingEmail!.split('@')[0]);
      setMfaRequired(false);
      setOtp('');
      navigate('/inicio');
    } catch (error: any) {
      setErrorMessage(error.detail || 'Código OTP inválido. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <BackgroundBlobs />
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.brandIcon} aria-hidden>
            <ShieldCheck size={28} />
          </span>
          <span className={styles.brandText}>Sirona</span>
        </div>

        {errorMessage && (
          <div className={styles.alertError}>
            <AlertCircle size={20} />
            <span>{errorMessage}</span>
          </div>
        )}

        {!mfaRequired && (
          <>
            <div className={styles.modes}>
              <button
                type="button"
                className={[styles.modeButton, modo === 'password' ? styles.active : ''].join(' ')}
                onClick={() => setModo('password')}
                disabled={loading}
              >
                Ingresar con contraseña
              </button>
              <button
                type="button"
                className={[styles.modeButton, modo === 'face' ? styles.active : ''].join(' ')}
                onClick={() => setModo('face')}
                disabled={loading}
              >
                Ingresar con reconocimiento facial
              </button>
            </div>

            {modo === 'password' && (
              <div className={styles.panel}>
                <LoginForm onSubmit={handlePasswordSubmit} loading={loading} isAccountLocked={accountLocked} />
              </div>
            )}

            {modo === 'face' && (
              <div className={styles.panel}>
                <form className={styles.faceForm} onSubmit={handleFaceSubmit}>
                  {accountLocked && (
                    <div className={styles.alertLocked}>
                      <AlertCircle size={20} />
                      <span>Cuenta bloqueada por 15 minutos</span>
                    </div>
                  )}

                  <Input
                    id="face-email"
                    label="Correo"
                    type="email"
                    value={faceEmail}
                    onChange={setFaceEmail}
                    placeholder="tu@correo.com"
                    autoComplete="email"
                    icon={<Mail size={16} />}
                  />

                  <div className={styles.captureSection}>
                    <FaceCameraCapture
                      onCapture={setFaceCapture}
                      onClear={() => setFaceCapture(null)}
                      disabled={loading || accountLocked}
                    />
                  </div>

                  <Button type="submit" variant="filled" color="primary" fullWidth disabled={loading || !faceCapture || accountLocked}>
                    {loading ? 'Verificando...' : 'Iniciar reconocimiento facial'}
                  </Button>
                </form>
              </div>
            )}
          </>
        )}

        {mfaRequired && (
          <div className={styles.panel}>
            <div className={styles.otpHeader}>
              <h2>Verificación MFA</h2>
              <p>Ingresa el código OTP enviado a tu segundo factor.</p>
            </div>
            <form className={styles.otpForm} onSubmit={handleOtpSubmit}>
              <Input
                id="otp-code"
                label="Código OTP"
                type="text"
                value={otp}
                onChange={setOtp}
                placeholder="123456"
                icon={<Hash size={16} />}
              />
              <Button type="submit" variant="filled" color="primary" fullWidth disabled={loading || otp.length < 6}>
                {loading ? 'Validando...' : 'Validar OTP'}
              </Button>
              <p className={styles.hint}>
                Las cuentas con mayor riesgo o rol de administrador siempre requieren MFA.
              </p>
            </form>
          </div>
        )}

        <div className={styles.foot}>
          <div className={styles.demoButtons}>
            <Button
              type="button"
              variant="filled"
              color="secondary"
              onClick={() => {
                const mockToken = 'mock_jwt_token_demo';
                login('demo@sirona.local', mockToken, 'Paciente', 'Demo Paciente');
                navigate('/inicio');
              }}
            >
              Demo Paciente
            </Button>
            <Button
              type="button"
              variant="filled"
              color="primary"
              onClick={() => {
                const mockToken = 'mock_jwt_token_doctor';
                login('doctor@sirona.local', mockToken, 'Médico', 'Dr. Demo');
                navigate('/inicio');
              }}
            >
              Demo Médico
            </Button>
            <Button
              type="button"
              variant="filled"
              color="quaternary"
              onClick={() => {
                const mockToken = 'mock_jwt_token_admin';
                login('admin@sirona.local', mockToken, 'Administrador', 'Admin');
                navigate('/inicio');
              }}
            >
              Demo Admin
            </Button>
            <Button
              type="button"
              variant="filled"
              color="tertiary"
              onClick={() => {
                const mockToken = 'mock_jwt_token_secretary';
                login('secretario@sirona.local', mockToken, 'Secretario', 'Secretario Demo');
                navigate('/inicio');
              }}
            >
              Demo Secretario
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
