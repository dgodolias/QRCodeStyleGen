// Shared constants for the QR style generator.

/** Internal resolution the QR engine renders at (author units). The QR is vector,
 *  so this only fixes module geometry; final pixels come from the export scale. */
export const QR_PX = 1000;

/** Master SVG author-space width. All frames are designed on a 1000-wide canvas. */
export const MASTER_W = 1000;

/** Height of the frame+QR block (square). */
export const FRAME_BLOCK_H = 1000;

/** Height of the bottom band reserved for the user's "Additional Text". */
export const TEXT_BAND_H = 170;

/** Hard caps for user text (also enforced in escapeXml). */
export const MAX_ADDITIONAL_TEXT = 120;
export const MAX_CTA_TEXT = 40;

export const DOT_TYPES = [
  'square',
  'rounded',
  'dots',
  'classy',
  'classy-rounded',
  'extra-rounded',
] as const;

export const CORNER_SQUARE_TYPES = ['square', 'dot', 'extra-rounded'] as const;
export const CORNER_DOT_TYPES = ['square', 'dot'] as const;

export const ERROR_CORRECTION_LEVELS = ['L', 'M', 'Q', 'H'] as const;

/** Font choices for Additional Text. Inter is bundled (self-hosted); the rest are
 *  ubiquitous OS fonts that the browser can rasterize without a webfont. */
export const FONT_OPTIONS: { label: string; value: string }[] = [
  { label: 'Inter', value: '"Inter", system-ui, sans-serif' },
  { label: 'System sans', value: 'system-ui, -apple-system, "Segoe UI", sans-serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Trebuchet', value: '"Trebuchet MS", Tahoma, sans-serif' },
  { label: 'Georgia', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Courier', value: '"Courier New", ui-monospace, monospace' },
  { label: 'Impact', value: 'Impact, Haettenschweiler, sans-serif' },
];

/** The font family the export rasterizer must preload (only the bundled webfont needs it). */
export const BUNDLED_FONT_FAMILY = 'Inter';
