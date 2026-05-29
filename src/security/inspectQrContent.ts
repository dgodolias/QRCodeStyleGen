import type { ErrorCorrectionLevel } from '../qr/types';

// Practical Byte-mode capacity ceilings per error-correction level (QR v40).
export const ECL_BYTE_CAP: Record<ErrorCorrectionLevel, number> = {
  L: 2953,
  M: 2331,
  Q: 1663,
  H: 1273,
};

// Schemes a careless scanner app might auto-open. We WARN, never block - it's the
// user's own QR and these can be legitimate, but they deserve a heads-up.
const DANGEROUS_SCHEMES = ['javascript:', 'data:', 'file:', 'vbscript:', 'blob:'];

export interface QrContentReport {
  warnScheme: string | null;
  overLength: boolean;
  cap: number;
  used: number;
}

/** Soft inspection of the QR payload: surface a dangerous-scheme warning and a
 *  capacity warning, without blocking generation. */
export function inspectQrContent(data: string, ecl: ErrorCorrectionLevel): QrContentReport {
  const cap = ECL_BYTE_CAP[ecl];
  const used = new TextEncoder().encode(data).length;
  const lower = data.trimStart().toLowerCase();
  const warnScheme = DANGEROUS_SCHEMES.find((s) => lower.startsWith(s)) ?? null;
  return {
    warnScheme,
    overLength: used > cap,
    cap,
    used,
  };
}
