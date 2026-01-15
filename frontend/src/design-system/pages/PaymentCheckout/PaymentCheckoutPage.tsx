import React, { useState } from 'react';
import { ShieldCheck, ExternalLink, AlertCircle } from 'lucide-react';
import { Container } from '../../atoms/Container/Container';
import { Button } from '../../atoms/Button/Button';
import {
  validatePaymentUrl,
  classifyPaymentGatewayError,
  paymentGatewayErrorMessage,
} from '../../../utils/paymentSecurity';
import type { PaymentGatewayErrorCode } from '../../../utils/paymentSecurity';
import styles from './PaymentCheckoutPage.module.scss';

type CreatePaymentResponse = {
  redirectUrl?: string;
  errorCode?: PaymentGatewayErrorCode;
};

export const PaymentCheckoutPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUrl, setLastUrl] = useState<string | null>(null);

  const startPayment = async () => {
    setLoading(true);
    setError(null);
    setLastUrl(null);

    try {
      // Replace with real backend endpoint when available
      const response = await fetch('/api/pagos/session', { method: 'POST' });

      if (!response.ok) {
        let payload: CreatePaymentResponse | undefined;
        try {
          payload = await response.json();
        } catch {
          // ignore body parse errors
        }
        const code = payload?.errorCode;
        throw Object.assign(new Error('payment_session_failed'), { code });
      }

      const payload: CreatePaymentResponse = await response.json();
      const candidateUrl = payload?.redirectUrl;

      if (!candidateUrl) {
        setError('No recibimos la URL de la pasarela. Intenta nuevamente.');
        return;
      }

      const validation = validatePaymentUrl(candidateUrl);
      if (!validation.ok) {
        if (validation.error === 'non_https') {
          setError('La pasarela no es segura: la URL debe usar https.');
        } else {
          setError('La URL de pago recibida es inválida. Intenta nuevamente.');
        }
        return;
      }

      setLastUrl(validation.url);
      window.location.href = validation.url;
    } catch (err) {
      const kind = classifyPaymentGatewayError(err);
      setError(paymentGatewayErrorMessage(kind));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.title}>
            <span className={styles.icon}>
              <ShieldCheck size={28} />
            </span>
            <div>
              <h1>Pago seguro</h1>
              <p className={styles.subtitle}>
                Solo redirigimos a URLs HTTPS y bloqueamos fallos de TLS/certificado.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className={styles.error}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className={styles.card}>
          <h2>Pasarela de pagos</h2>
          <p className={styles.text}>
            Presiona el botón para crear la sesión de pago. Solo continuaremos si la URL de la pasarela es HTTPS y pasa las validaciones.
          </p>

          <div className={styles.actions}>
            <Button
              variant="filled"
              color="primary"
              onClick={startPayment}
              startIcon={<ExternalLink size={16} />}
              disabled={loading}
            >
              {loading ? 'Redirigiendo...' : 'Ir a pagar'}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setLastUrl(null)}
              disabled={loading}
            >
              Limpiar estado
            </Button>
          </div>

          {lastUrl && <p className={styles.helper}>Redirigiendo a: {lastUrl}</p>}
        </div>

        <div className={styles.note}>
          <AlertCircle size={16} />
          <p className={styles.helper}>
            TLS 1.3 es requerido. Si la pasarela devuelve un certificado inválido o intenta negociar un protocolo anterior, mostraremos un mensaje de error genérico y no continuaremos.
          </p>
        </div>
      </div>
    </Container>
  );
};
