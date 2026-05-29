import type {
  DOT_TYPES,
  CORNER_SQUARE_TYPES,
  CORNER_DOT_TYPES,
  ERROR_CORRECTION_LEVELS,
} from '../constants';

export type DotType = (typeof DOT_TYPES)[number];
export type CornerSquareType = (typeof CORNER_SQUARE_TYPES)[number];
export type CornerDotType = (typeof CORNER_DOT_TYPES)[number];
export type ErrorCorrectionLevel = (typeof ERROR_CORRECTION_LEVELS)[number];
export type ExportFormat = 'png' | 'svg' | 'jpeg';

export interface GradientStop {
  offset: number; // 0..1
  color: string;
}

export interface GradientSpec {
  type: 'linear' | 'radial';
  rotation: number; // radians
  colorStops: [GradientStop, GradientStop];
}

/** A fill that is either a flat color or a two-stop gradient. */
export interface StyleColor {
  color: string;
  gradient: GradientSpec | null;
}

export interface LogoConfig {
  /** Sanitized, canvas-re-encoded base64 data URL — the ONLY thing handed to the engine. */
  dataUrl: string;
  name: string;
  size: number; // imageSize coefficient, clamped 0.1..0.3
  margin: number; // px in QR space
  hideBackgroundDots: boolean;
}

export interface FrameConfig {
  id: string; // FrameDef id; 'none' => no overlay
  color: string;
  textColor: string;
  ctaText: string;
  ctaSize: number;
}

export interface AdditionalText {
  text: string;
  font: string; // a value from FONT_OPTIONS
  size: number; // px in master units
  color: string;
}

export interface QRConfig {
  data: string;
  errorCorrectionLevel: ErrorCorrectionLevel;
  margin: number; // quiet zone in QR px
  dots: { type: DotType } & StyleColor;
  /** Per-dot size factor: 1 = dots touch (default), <1 = gap between dots. */
  dotScale: number;
  cornersSquare: { type: CornerSquareType } & StyleColor;
  cornersDot: { type: CornerDotType } & StyleColor;
  background: StyleColor;
  logo: LogoConfig | null;
  frame: FrameConfig;
  additionalText: AdditionalText | null;
}
