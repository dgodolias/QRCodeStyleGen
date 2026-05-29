import type {
  QRConfig,
  StyleColor,
  LogoConfig,
  AdditionalText,
  ErrorCorrectionLevel,
  DotType,
  CornerSquareType,
  CornerDotType,
} from '../qr/types';
import { getFrame } from '../frames/registry';
import { eclRank } from '../lib/ecl';

export const DEFAULT_CONFIG: QRConfig = {
  data: 'https://github.com',
  errorCorrectionLevel: 'Q',
  margin: 60,
  dots: { type: 'rounded', color: '#0a0a14', gradient: null },
  dotScale: 1,
  cornersSquare: { type: 'square', color: '#0a0a14', gradient: null },
  cornersDot: { type: 'square', color: '#0a0a14', gradient: null },
  background: { color: '#ffffff', gradient: null },
  logo: null,
  frame: { id: 'none', color: '#0a0a14', textColor: '#ffffff', ctaText: 'SCAN ME', ctaSize: 62 },
  additionalText: null,
};

export type ConfigAction =
  | { type: 'SET_DATA'; value: string }
  | { type: 'SET_ECL'; value: ErrorCorrectionLevel }
  | { type: 'SET_MARGIN'; value: number }
  | { type: 'SET_DOTS'; patch: Partial<{ type: DotType } & StyleColor> }
  | { type: 'SET_DOT_SCALE'; value: number }
  | { type: 'SET_CORNERS_SQUARE'; patch: Partial<{ type: CornerSquareType } & StyleColor> }
  | { type: 'SET_CORNERS_DOT'; patch: Partial<{ type: CornerDotType } & StyleColor> }
  | { type: 'SET_BACKGROUND'; patch: Partial<StyleColor> }
  | { type: 'SET_LOGO'; value: LogoConfig | null }
  | { type: 'PATCH_LOGO'; patch: Partial<LogoConfig> }
  | { type: 'SELECT_FRAME'; id: string }
  | { type: 'PATCH_FRAME'; patch: Partial<QRConfig['frame']> }
  | { type: 'SET_ADDITIONAL_TEXT'; value: AdditionalText | null }
  | { type: 'PATCH_ADDITIONAL_TEXT'; patch: Partial<AdditionalText> }
  | { type: 'REPLACE'; value: QRConfig }
  | { type: 'RESET' };

export function configReducer(state: QRConfig, action: ConfigAction): QRConfig {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, data: action.value };
    case 'SET_ECL':
      return { ...state, errorCorrectionLevel: action.value };
    case 'SET_MARGIN':
      return { ...state, margin: action.value };
    case 'SET_DOTS':
      return { ...state, dots: { ...state.dots, ...action.patch } };
    case 'SET_DOT_SCALE':
      return { ...state, dotScale: action.value };
    case 'SET_CORNERS_SQUARE':
      return { ...state, cornersSquare: { ...state.cornersSquare, ...action.patch } };
    case 'SET_CORNERS_DOT':
      return { ...state, cornersDot: { ...state.cornersDot, ...action.patch } };
    case 'SET_BACKGROUND':
      return { ...state, background: { ...state.background, ...action.patch } };
    case 'SET_LOGO': {
      // Adding a logo auto-raises error correction to H (a logo covers data modules).
      const ecl =
        action.value && eclRank(state.errorCorrectionLevel) < eclRank('H')
          ? ('H' as ErrorCorrectionLevel)
          : state.errorCorrectionLevel;
      return { ...state, logo: action.value, errorCorrectionLevel: ecl };
    }
    case 'PATCH_LOGO':
      return state.logo ? { ...state, logo: { ...state.logo, ...action.patch } } : state;
    case 'SELECT_FRAME': {
      const def = getFrame(action.id);
      return {
        ...state,
        frame: {
          id: def.id,
          color: def.defaultColor,
          textColor: def.defaultTextColor,
          ctaText: def.cta?.defaultText ?? 'SCAN ME',
          ctaSize: def.cta?.defaultSize ?? 56,
        },
      };
    }
    case 'PATCH_FRAME':
      return { ...state, frame: { ...state.frame, ...action.patch } };
    case 'SET_ADDITIONAL_TEXT':
      return { ...state, additionalText: action.value };
    case 'PATCH_ADDITIONAL_TEXT':
      return state.additionalText
        ? { ...state, additionalText: { ...state.additionalText, ...action.patch } }
        : state;
    case 'REPLACE':
      return action.value;
    case 'RESET':
      return DEFAULT_CONFIG;
    default:
      return state;
  }
}
