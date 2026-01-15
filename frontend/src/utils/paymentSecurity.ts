/**
 * Helpers to enforce HTTPS-only payment redirects and surface safe errors.
 */
export type PaymentUrlValidationResult =
  | { ok: true; url: string }
  | { ok: false; error: 'invalid_url' | 'non_https' };

export function validatePaymentUrl(input: string): PaymentUrlValidationResult {
  try {
    const parsed = new URL(input);
    if (parsed.protocol !== 'https:') {
      return { ok: false, error: 'non_https' };
    }
    return { ok: true, url: parsed.toString() };
  } catch {
    return { ok: false, error: 'invalid_url' };
  }
}

export type PaymentGatewayErrorCode = 'tls_error' | 'network_error' | 'unknown';

const TLS_ERROR_MARKERS = [
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'CERTIFICATE_VERIFY_FAILED',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'ERR_TLS_CERT_ALTNAME_INVALID',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
];

export function classifyPaymentGatewayError(err: unknown): PaymentGatewayErrorCode {
  const code = (err as { code?: string })?.code;
  const message = (err as { message?: string })?.message;
  const text = `${code ?? ''} ${message ?? ''}`.toUpperCase();

  if (TLS_ERROR_MARKERS.some((marker) => text.includes(marker))) {
    return 'tls_error';
  }

  if (text.includes('ECONN') || text.includes('ETIME') || text.includes('NETWORK')) {
    return 'network_error';
  }

  return 'unknown';
}

export function paymentGatewayErrorMessage(kind: PaymentGatewayErrorCode): string {
  switch (kind) {
    case 'tls_error':
      return 'No se pudo iniciar el pago por un problema de seguridad con la pasarela (TLS). Intenta más tarde.';
    case 'network_error':
      return 'No se pudo iniciar el pago por un problema de conexión. Intenta de nuevo en unos segundos.';
    default:
      return 'No se pudo iniciar el pago. Intenta nuevamente.';
  }
}
