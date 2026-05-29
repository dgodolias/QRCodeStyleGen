import { useConfig, useConfigDispatch } from '../../state/ConfigContext';
import { ERROR_CORRECTION_LEVELS } from '../../constants';
import { inspectQrContent } from '../../security/inspectQrContent';
import { adviseEcl } from '../../lib/ecl';

export function ContentPanel() {
  const cfg = useConfig();
  const dispatch = useConfigDispatch();

  const report = inspectQrContent(cfg.data, cfg.errorCorrectionLevel);
  const eclAdvice = adviseEcl(cfg);

  return (
    <div className="card stack" data-testid="panel-content">
      <div className="section-title">Content</div>

      <div className="field">
        <label className="lbl" htmlFor="qr-data">
          URL or text
        </label>
        <input
          id="qr-data"
          className="input"
          type="text"
          spellCheck={false}
          placeholder="https://your-link.com"
          value={cfg.data}
          data-testid="input-data"
          onChange={(e) => dispatch({ type: 'SET_DATA', value: e.target.value })}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <span className="lbl">Error correction</span>
          <div className="seg-inline" role="group" aria-label="Error correction level">
            {ERROR_CORRECTION_LEVELS.map((lvl) => (
              <button
                key={lvl}
                type="button"
                className={cfg.errorCorrectionLevel === lvl ? 'active' : ''}
                data-testid={`ecl-${lvl}`}
                onClick={() => dispatch({ type: 'SET_ECL', value: lvl })}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="lbl">Quiet zone</span>
          <div className="range-row">
            <input
              type="range"
              min={0}
              max={160}
              step={10}
              value={cfg.margin}
              data-testid="input-margin"
              onChange={(e) => dispatch({ type: 'SET_MARGIN', value: Number(e.target.value) })}
            />
            <span className="val">{cfg.margin}px</span>
          </div>
        </div>
      </div>

      {eclAdvice.warning && (
        <div className="notice warn" data-testid="notice-ecl">
          <span>⚠</span>
          <span>{eclAdvice.warning}</span>
        </div>
      )}

      {report.warnScheme && (
        <div className="notice danger" data-testid="notice-scheme">
          <span>⚠</span>
          <span>
            This QR encodes a <code>{report.warnScheme}</code> link. Some scanners may open it
            automatically — only continue if you trust it.
          </span>
        </div>
      )}

      {report.overLength && (
        <div className="notice warn" data-testid="notice-length">
          <span>⚠</span>
          <span>
            Content is long ({report.used} bytes, ~{report.cap} max at level{' '}
            {cfg.errorCorrectionLevel}). Lower the error correction or shorten the text.
          </span>
        </div>
      )}
    </div>
  );
}
