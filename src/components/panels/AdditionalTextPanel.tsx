import { useConfig, useConfigDispatch } from '../../state/ConfigContext';
import { FONT_OPTIONS, MAX_ADDITIONAL_TEXT } from '../../constants';
import { ColorField } from '../ColorField';
import { Switch } from '../Switch';

export function AdditionalTextPanel() {
  const cfg = useConfig();
  const dispatch = useConfigDispatch();
  const at = cfg.additionalText;

  function toggle(on: boolean) {
    dispatch({
      type: 'SET_ADDITIONAL_TEXT',
      value: on
        ? { text: '', font: FONT_OPTIONS[0]!.value, size: 48, color: '#0a0a14' }
        : null,
    });
  }

  return (
    <div className="panel" data-testid="panel-text">
      <div className="card stack">
        <div className="section-title">Additional text</div>
        <Switch label="Add text below the code" checked={!!at} onChange={toggle} testId="text-enable" />

        {at && (
          <>
            <div className="field">
              <label className="lbl" htmlFor="add-text">
                Text
              </label>
              <input
                id="add-text"
                className="input"
                type="text"
                maxLength={MAX_ADDITIONAL_TEXT}
                placeholder="e.g. Scan to visit us"
                value={at.text}
                data-testid="input-text"
                onChange={(e) => dispatch({ type: 'PATCH_ADDITIONAL_TEXT', patch: { text: e.target.value } })}
              />
            </div>

            <div className="field-row">
              <div className="field">
                <label className="lbl" htmlFor="text-font">
                  Font
                </label>
                <select
                  id="text-font"
                  className="input"
                  value={at.font}
                  data-testid="select-font"
                  onChange={(e) => dispatch({ type: 'PATCH_ADDITIONAL_TEXT', patch: { font: e.target.value } })}
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.label} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <span className="lbl">Font size</span>
                <div className="range-row">
                  <input
                    type="range"
                    min={20}
                    max={110}
                    step={2}
                    value={at.size}
                    data-testid="text-size"
                    onChange={(e) =>
                      dispatch({ type: 'PATCH_ADDITIONAL_TEXT', patch: { size: Number(e.target.value) } })
                    }
                  />
                  <span className="val">{at.size}px</span>
                </div>
              </div>
            </div>

            <ColorField
              label="Text color"
              value={at.color}
              onChange={(c) => dispatch({ type: 'PATCH_ADDITIONAL_TEXT', patch: { color: c } })}
              testId="text-color"
            />
          </>
        )}
      </div>
    </div>
  );
}
