export type FrameCategory = 'standard' | 'holidays' | 'events' | 'themes';

export const FRAME_CATEGORIES: { id: FrameCategory; label: string }[] = [
  { id: 'standard', label: 'Standard' },
  { id: 'holidays', label: 'Holidays' },
  { id: 'events', label: 'Events' },
  { id: 'themes', label: 'Themes' },
];

/** Where the styled QR is injected, in the 0..1000 master author space. Always square. */
export interface QrSlot {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CtaDef {
  defaultText: string;
  defaultSize: number;
}

export interface FrameRenderOpts {
  frameColor: string;
  /** Already XML-escaped by the caller. */
  ctaText: string;
  ctaColor: string;
  ctaSize: number;
  fontFamily: string;
}

export interface FrameDef {
  id: string;
  name: string;
  category: FrameCategory;
  qrSlot: QrSlot;
  /** null => frame has no call-to-action text. */
  cta: CtaDef | null;
  defaultColor: string;
  defaultTextColor: string;
  /** Returns an SVG fragment (no <svg> wrapper) drawn BEHIND the QR, in 0..1000 space.
   *  MUST be pure shapes/text — no <script>, <foreignObject>, <image>, or external refs. */
  render(opts: FrameRenderOpts): string;
}
