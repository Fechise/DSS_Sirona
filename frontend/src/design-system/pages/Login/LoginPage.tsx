import React, { useState } from 'react';
import styles from './LoginPage.module.scss';
import { LoginForm } from '../../molecules/LoginForm/LoginForm';
import { ShieldCheck, AlertCircle, Hash, Smartphone, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../atoms/Button/Button';
import { Input } from '../../atoms/Input/Input';
import { AuthApiService, type MFARequiredResponse } from '../../../services/api';
import { BackgroundBlobs } from './BackgroundBlobs';

export const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaSetupRequired, setMfaSetupRequired] = useState(false);
  const [otp, setOtp] = useState('');
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [secretCopied, setSecretCopied] = useState(false);
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

      console.log('Login response:', response);

      // Verificar si es respuesta MFA (tiene temp_token)
      if ('temp_token' in response) {
        const mfaResponse = response as unknown as MFARequiredResponse;
        setMfaRequired(true);
        setPendingEmail(data.email);
        setTempToken(mfaResponse.temp_token);
        
        // Si es setup inicial, guardar QR y secreto
        if (mfaResponse.mfa_setup_required) {
          setMfaSetupRequired(true);
          setQrCode(mfaResponse.qr_code || null);
          setSecretKey(mfaResponse.secret_key || null);
        } else {
          setMfaSetupRequired(false);
          setQrCode(null);
          setSecretKey(null);
        }
      } else if (response.requires_mfa) {
        // Fallback para respuesta antigua
        setMfaRequired(true);
        setPendingEmail(data.email);
      } else {
        // Login sin MFA (no debería pasar ahora)
        const userName = response.user?.fullName || data.email.split('@')[0];
        const userCedula = response.user?.cedula || '';
        login(data.email, response.token, response.role, userName, userCedula);
        navigate('/inicio');
      }
    } catch (error: any) {
      console.error('Login failed:', error);
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

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      // Llamar al nuevo endpoint con temp_token
      const response = await AuthApiService.verifyOtp(
        tempToken!,
        otp,
        mfaSetupRequired ? secretKey || undefined : undefined
      );

      // Login exitoso
      login(
        response.email || pendingEmail!,
        response.access_token,
        response.role,
        response.email?.split('@')[0] || ''
      );
      
      // Limpiar estado MFA
      setMfaRequired(false);
      setMfaSetupRequired(false);
      setOtp('');
      setQrCode(null);
      setSecretKey(null);
      setTempToken(null);
      
      navigate('/inicio');
    } catch (error: any) {
      setErrorMessage(error.detail || 'Código OTP inválido. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = () => {
    if (secretKey) {
      navigator.clipboard.writeText(secretKey);
      setSecretCopied(true);
      setTimeout(() => setSecretCopied(false), 2000);
    }
  };

  const handleBackToLogin = () => {
    setMfaRequired(false);
    setMfaSetupRequired(false);
    setOtp('');
    setQrCode(null);
    setSecretKey(null);
    setTempToken(null);
    setErrorMessage(null);
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
          <div className={styles.panel}>
            <LoginForm onSubmit={handlePasswordSubmit} loading={loading} isAccountLocked={accountLocked} />
          </div>
        )}

        {mfaRequired && (
          <div className={styles.panel}>
            {mfaSetupRequired ? (
              // Setup inicial de MFA - Mostrar QR
              <>
                <div className={styles.otpHeader}>
                  <div className={styles.mfaIcon}>
                    <Smartphone size={32} />
                  </div>
                  <h2>Configura tu autenticador</h2>
                  <p>Escanea el código QR con tu aplicación de autenticación (Google Authenticator, Authy, Microsoft Authenticator, etc.)</p>
                </div>
                
                {qrCode && (
                  <div className={styles.qrContainer}>
                    <img 
                      src={qrCode} 
                      alt="Código QR para autenticador" 
                      className={styles.qrImage}
                    />
                  </div>
                )}

                {secretKey && (
                  <div className={styles.secretContainer}>
                    <p className={styles.secretLabel}>¿No puedes escanear? Ingresa este código manualmente:</p>
                    <div className={styles.secretKey}>
                      <code>{secretKey}</code>
                      <button 
                        type="button" 
                        onClick={handleCopySecret}
                        className={styles.copyButton}
                        title="Copiar código"
                      >
                        {secretCopied ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                <form className={styles.otpForm} onSubmit={handleOtpSubmit}>
                  <Input
                    id="otp-code"
                    label="Código de verificación"
                    type="text"
                    value={otp}
                    onChange={setOtp}
                    placeholder="000000"
                    icon={<Hash size={16} />}
                    maxLength={6}
                  />
                  <Button 
                    type="submit" 
                    variant="filled" 
                    color="primary" 
                    fullWidth 
                    disabled={loading || otp.length < 6}
                  >
                    {loading ? 'Verificando...' : 'Verificar y completar'}
                  </Button>
                  <button 
                    type="button" 
                    className={styles.backLink}
                    onClick={handleBackToLogin}
                  >
                    ← Volver al inicio de sesión
                  </button>
                </form>
              </>
            ) : (
              // MFA ya configurado - Solo pedir código
              <>
                <div className={styles.otpHeader}>
                  <div className={styles.mfaIcon}>
                    <ShieldCheck size={32} />
                  </div>
                  <h2>Verificación MFA</h2>
                  <p>Ingresa el código de 6 dígitos de tu aplicación de autenticación.</p>
                </div>
                <form className={styles.otpForm} onSubmit={handleOtpSubmit}>
                  <Input
                    id="otp-code"
                    label="Código OTP"
                    type="text"
                    value={otp}
                    onChange={setOtp}
                    placeholder="000000"
                    icon={<Hash size={16} />}
                    maxLength={6}
                  />
                  <Button 
                    type="submit" 
                    variant="filled" 
                    color="primary" 
                    fullWidth 
                    disabled={loading || otp.length < 6}
                  >
                    {loading ? 'Validando...' : 'Validar OTP'}
                  </Button>
                  <button 
                    type="button" 
                    className={styles.backLink}
                    onClick={handleBackToLogin}
                  >
                    ← Volver al inicio de sesión
                  </button>
                </form>
              </>
            )}
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
