import { useConfig, useConfigDispatch } from '../../state/ConfigContext';
import { DOT_TYPES, CORNER_SQUARE_TYPES, CORNER_DOT_TYPES } from '../../constants';
import { SwatchPicker, type SwatchOption } from '../SwatchPicker';
import { DotIcon, CornerSquareIcon, CornerDotIcon } from '../shapeIcons';
import { FillControl } from '../FillControl';
import type { DotType, CornerSquareType, CornerDotType } from '../../qr/types';

const DOT_LABEL: Record<DotType, string> = {
  square: 'Square',
  rounded: 'Rounded',
  dots: 'Dots',
  classy: 'Classy',
  'classy-rounded': 'Classy+',
  'extra-rounded': 'Extra',
};
const CSQ_LABEL: Record<CornerSquareType, string> = {
  square: 'Square',
  dot: 'Dot',
  'extra-rounded': 'Rounded',
};
const CDOT_LABEL: Record<CornerDotType, string> = { square: 'Square', dot: 'Dot' };

const dotOptions: SwatchOption<DotType>[] = DOT_TYPES.map((t) => ({
  value: t,
  label: DOT_LABEL[t],
  icon: <DotIcon type={t} />,
}));
const cornerSquareOptions: SwatchOption<CornerSquareType>[] = CORNER_SQUARE_TYPES.map((t) => ({
  value: t,
  label: CSQ_LABEL[t],
  icon: <CornerSquareIcon type={t} />,
}));
const cornerDotOptions: SwatchOption<CornerDotType>[] = CORNER_DOT_TYPES.map((t) => ({
  value: t,
  label: CDOT_LABEL[t],
  icon: <CornerDotIcon type={t} />,
}));

export function ShapesPanel() {
  const cfg = useConfig();
  const dispatch = useConfigDispatch();

  return (
    <div className="panel" data-testid="panel-shapes">
      <div className="card stack">
        <div className="section-title">Body</div>
        <SwatchPicker
          label="Dot style"
          options={dotOptions}
          value={cfg.dots.type}
          onSelect={(type) => dispatch({ type: 'SET_DOTS', patch: { type } })}
          testIdPrefix="dot"
        />
        <div className="field">
          <span className="lbl">Dot spacing</span>
          <div className="range-row">
            <input
              type="range"
              min={0}
              max={40}
              step={1}
              value={Math.round((1 - cfg.dotScale) * 100)}
              data-testid="dot-spacing"
              onChange={(e) =>
                dispatch({ type: 'SET_DOT_SCALE', value: 1 - Number(e.target.value) / 100 })
              }
            />
            <span className="val">{Math.round((1 - cfg.dotScale) * 100)}%</span>
          </div>
          <span className="hint">0% = dots touch · higher = more breathing room</span>
        </div>

        {cfg.dotScale < 0.7 && (
          <div className="notice warn" data-testid="notice-spacing">
            <span>⚠</span>
            <span>
              Large gaps can make the code harder to scan — test with your phone before
              downloading.
            </span>
          </div>
        )}

        <FillControl
          label="Dots color"
          value={cfg.dots}
          onChange={(patch) => dispatch({ type: 'SET_DOTS', patch })}
          testIdPrefix="dots-fill"
        />
      </div>

      <div className="card stack">
        <div className="section-title">Corners</div>
        <SwatchPicker
          label="Corner frame"
          options={cornerSquareOptions}
          value={cfg.cornersSquare.type}
          onSelect={(type) => dispatch({ type: 'SET_CORNERS_SQUARE', patch: { type } })}
          testIdPrefix="csq"
        />
        <FillControl
          label="Corner frame color"
          value={cfg.cornersSquare}
          onChange={(patch) => dispatch({ type: 'SET_CORNERS_SQUARE', patch })}
          testIdPrefix="csq-fill"
        />
        <SwatchPicker
          label="Corner center"
          options={cornerDotOptions}
          value={cfg.cornersDot.type}
          onSelect={(type) => dispatch({ type: 'SET_CORNERS_DOT', patch: { type } })}
          testIdPrefix="cdot"
        />
        <FillControl
          label="Corner center color"
          value={cfg.cornersDot}
          onChange={(patch) => dispatch({ type: 'SET_CORNERS_DOT', patch })}
          testIdPrefix="cdot-fill"
        />
      </div>

      <div className="card stack">
        <div className="section-title">Background</div>
        <FillControl
          label="Background color"
          value={cfg.background}
          onChange={(patch) => dispatch({ type: 'SET_BACKGROUND', patch })}
          testIdPrefix="bg-fill"
        />
      </div>
    </div>
  );
}
