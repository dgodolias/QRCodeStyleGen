import { ColorField } from './ColorField';
import type { StyleColor, GradientSpec } from '../qr/types';

/** Edits a StyleColor: a flat color, or a two-stop linear/radial gradient. */
export function FillControl({
  label,
  value,
  onChange,
  testIdPrefix,
}: {
  label: string;
  value: StyleColor;
  onChange: (patch: Partial<StyleColor>) => void;
  testIdPrefix?: string;
}) {
  const isGradient = !!value.gradient;

  function setMode(gradient: boolean) {
    if (gradient && !value.gradient) {
      const g: GradientSpec = {
        type: 'linear',
        rotation: 0,
        colorStops: [
          { offset: 0, color: value.color },
          { offset: 1, color: '#4078ff' },
        ],
      };
      onChange({ gradient: g });
    } else if (!gradient && value.gradient) {
      onChange({ gradient: null });
    }
  }

  function patchGradient(patch: Partial<GradientSpec>) {
    if (!value.gradient) return;
    onChange({ gradient: { ...value.gradient, ...patch } });
  }

  function setStop(index: 0 | 1, color: string) {
    if (!value.gradient) return;
    const stops = [...value.gradient.colorStops] as GradientSpec['colorStops'];
    stops[index] = { ...stops[index], color };
    onChange({ gradient: { ...value.gradient, colorStops: stops } });
  }

  return (
    <div className="stack">
      <div className="row-between">
        <span className="lbl">{label}</span>
        <div className="seg-inline" role="group" aria-label={`${label} fill type`}>
          <button
            type="button"
            className={!isGradient ? 'active' : ''}
            data-testid={testIdPrefix ? `${testIdPrefix}-solid` : undefined}
            onClick={() => setMode(false)}
          >
            Solid
          </button>
          <button
            type="button"
            className={isGradient ? 'active' : ''}
            data-testid={testIdPrefix ? `${testIdPrefix}-gradient` : undefined}
            onClick={() => setMode(true)}
          >
            Gradient
          </button>
        </div>
      </div>

      {!isGradient && (
        <ColorField
          value={value.color}
          onChange={(c) => onChange({ color: c })}
          testId={testIdPrefix ? `${testIdPrefix}-color` : undefined}
        />
      )}

      {isGradient && value.gradient && (
        <div className="stack">
          <div className="field-row">
            <ColorField label="From" value={value.gradient.colorStops[0].color} onChange={(c) => setStop(0, c)} />
            <ColorField label="To" value={value.gradient.colorStops[1].color} onChange={(c) => setStop(1, c)} />
          </div>
          <div className="field-row">
            <div className="field">
              <span className="lbl">Type</span>
              <div className="seg-inline">
                <button
                  type="button"
                  className={value.gradient.type === 'linear' ? 'active' : ''}
                  onClick={() => patchGradient({ type: 'linear' })}
                >
                  Linear
                </button>
                <button
                  type="button"
                  className={value.gradient.type === 'radial' ? 'active' : ''}
                  onClick={() => patchGradient({ type: 'radial' })}
                >
                  Radial
                </button>
              </div>
            </div>
            {value.gradient.type === 'linear' && (
              <div className="field">
                <span className="lbl">Rotation</span>
                <div className="range-row">
                  <input
                    type="range"
                    min={0}
                    max={360}
                    step={5}
                    value={Math.round((value.gradient.rotation * 180) / Math.PI)}
                    onChange={(e) => patchGradient({ rotation: (Number(e.target.value) * Math.PI) / 180 })}
                  />
                  <span className="val">{Math.round((value.gradient.rotation * 180) / Math.PI)}°</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
