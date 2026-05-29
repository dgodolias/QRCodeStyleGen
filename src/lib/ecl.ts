import type { QRConfig, ErrorCorrectionLevel } from '../qr/types';

const ORDER: ErrorCorrectionLevel[] = ['L', 'M', 'Q', 'H'];

export function eclRank(ecl: ErrorCorrectionLevel): number {
  return ORDER.indexOf(ecl);
}

export interface EclAdvice {
  /** True when a logo is present and the current ECL is below the safe floor (H). */
  belowLogoFloor: boolean;
  warning: string | null;
}

/** A logo punches a hole in the matrix, so error correction must be high enough to
 *  recover it. We recommend H whenever a logo is set. This does not mutate config -
 *  it only reports; the reducer auto-raises and the user may override with a warning. */
export function adviseEcl(cfg: QRConfig): EclAdvice {
  if (!cfg.logo) return { belowLogoFloor: false, warning: null };
  const below = eclRank(cfg.errorCorrectionLevel) < eclRank('H');
  return {
    belowLogoFloor: below,
    warning: below
      ? 'With a logo, error correction below "H" can make the code unscannable.'
      : null,
  };
}
