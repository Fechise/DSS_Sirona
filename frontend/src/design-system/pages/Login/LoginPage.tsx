import React, { useMemo, useState } from 'react';
import styles from './LoginPage.module.scss';
import { LoginForm } from '../../molecules/LoginForm/LoginForm';
import { ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../atoms/Button/Button';

export const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [modo, setModo] = useState<'password' | 'face'>('password');
  const [faceEmail, setFaceEmail] = useState('');
  const [faceCapture, setFaceCapture] = useState<File | null>(null);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [otp, setOtp] = useState('');
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState<string>('user');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handlePasswordSubmit = async (data: { email: string; password: string }) => {
    setLoading(true);
    try {
      // TODO: integrar con FastAPI (ej. POST /auth/login)
      // const res = await fetch('/api/auth/login', { method: 'POST', body: JSON.stringify(data) });
      // const { token, role } = await res.json();
      await new Promise((r) => setTimeout(r, 600)); // simulación
      
      // Mock: responder que se requiere MFA (por ejemplo, administradores o riesgo alto)
      const requiresMfa = true;
      const mockToken = 'mock_jwt_token_' + Date.now();
      const role = 'user';

      if (requiresMfa) {
        setMfaRequired(true);
        setPendingEmail(data.email);
        setPendingRole(role);
        // el token definitivo se obtendría tras validar el OTP; aquí sólo simulamos el flujo
      } else {
        login(data.email, mockToken, role);
        navigate('/inicio');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: integrar con FastAPI (POST /auth/login/face) incluyendo prueba de vida y template biométrico
      await new Promise((r) => setTimeout(r, 600)); // simulación

      // Mock: éxito facial + liveness OK
      const requiresMfa = true;
      const role = 'user';
      const email = faceEmail || 'face@sirona.local';

      if (requiresMfa) {
        setMfaRequired(true);
        setPendingEmail(email);
        setPendingRole(role);
      } else {
        const mockToken = 'mock_face_token_' + Date.now();
        login(email, mockToken, role);
        navigate('/inicio');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: validar OTP contra backend (ej. POST /auth/otp/verify)
      await new Promise((r) => setTimeout(r, 500));

      // Mock: OTP correcto
      const mockToken = 'mock_otp_token_' + Date.now();
      const email = pendingEmail || 'user@sirona.local';
      login(email, mockToken, pendingRole);
      setMfaRequired(false);
      setOtp('');
      navigate('/inicio');
    } finally {
      setLoading(false);
    }
  };

  const livenessTip = useMemo(
    () =>
      'Se requiere prueba de vida (movimiento/cierre de ojos) y coincidencia con la plantilla biométrica almacenada.',
    []
  );

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.brandIcon} aria-hidden>
            <ShieldCheck size={28} />
          </span>
          <span className={styles.brandText}>Sirona</span>
        </div>
        {!mfaRequired && (
          <>
            <div className={styles.modes}>
              <button
                type="button"
                className={[
                  styles.modeButton,
                  modo === 'password' ? styles.active : '',
                ].join(' ')}
                onClick={() => setModo('password')}
                disabled={loading}
              >
                Ingresar con contraseña
              </button>
              <button
                type="button"
                className={[
                  styles.modeButton,
                  modo === 'face' ? styles.active : '',
                ].join(' ')}
                onClick={() => setModo('face')}
                disabled={loading}
              >
                Ingresar con reconocimiento facial
              </button>
            </div>

            {modo === 'password' && (
              <div className={styles.panel}>
                <LoginForm onSubmit={handlePasswordSubmit} loading={loading} />
              </div>
            )}

            {modo === 'face' && (
              <div className={styles.panel}>
                <form className={styles.faceForm} onSubmit={handleFaceSubmit}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="face-email">Correo</label>
                    <input
                      id="face-email"
                      type="email"
                      value={faceEmail}
                      onChange={(e) => setFaceEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="face-capture">Captura en vivo (prueba de vida)</label>
                    <input
                      id="face-capture"
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={(e) => setFaceCapture(e.target.files?.[0] || null)}
                      required
                    />
                    <p className={styles.hint}>{livenessTip}</p>
                  </div>

                  <Button type="submit" variant="primary" fullWidth disabled={loading || !faceCapture}>
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
              <div className={styles.fieldGroup}>
                <label htmlFor="otp-code">Código OTP</label>
                <input
                  id="otp-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  required
                />
              </div>
              <Button type="submit" variant="primary" fullWidth disabled={loading || otp.length < 6}>
                {loading ? 'Validando...' : 'Validar OTP'}
              </Button>
              <p className={styles.hint}>
                Las cuentas con mayor riesgo o rol de administrador siempre requieren MFA.
              </p>
            </form>
          </div>
        )}
        <div className={styles.foot}>
          <div className={styles.links}>
            <button
              type="button"
              className={styles.ctaLink}
              onClick={() => navigate('/register')}
            >
              ¿No estás registrado? Regístrate aquí
            </button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const mockToken = 'mock_jwt_token_demo';
                login('demo@sirona.local', mockToken, 'demo');
                navigate('/inicio');
              }}
            >
              Entrar como demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};