import { useState } from 'react';
import { exportArtifact } from '../lib/export';
import type { ExportFormat } from '../qr/types';
import type { MasterSvg } from '../compositor/serializeMasterSvg';

const SCALES = [1, 2, 3, 4];

export function ExportBar({ master }: { master: MasterSvg | null }) {
  const [scale, setScale] = useState(3);
  const [fileName, setFileName] = useState('qr-code');
  const [busy, setBusy] = useState<ExportFormat | null>(null);

  async function download(fmt: ExportFormat) {
    if (!master) return;
    setBusy(fmt);
    try {
      await exportArtifact(master, fmt, { scale, fileName });
    } catch {
      /* surfaced to console; UI stays responsive */
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="card export-bar" data-testid="export-bar">
      <div className="section-title">Download</div>

      <div className="field">
        <label className="lbl" htmlFor="export-name">
          File name
        </label>
        <input
          id="export-name"
          className="input"
          type="text"
          value={fileName}
          spellCheck={false}
          data-testid="export-name"
          onChange={(e) => setFileName(e.target.value)}
        />
      </div>

      <div className="field">
        <span className="lbl">Resolution</span>
        <div className="seg-inline" role="group" aria-label="Export resolution">
          {SCALES.map((s) => (
            <button
              key={s}
              type="button"
              className={scale === s ? 'active' : ''}
              data-testid={`scale-${s}`}
              onClick={() => setScale(s)}
            >
              {s}×
            </button>
          ))}
        </div>
        <span className="hint">{1000 * scale}px wide PNG/JPEG · SVG is infinite</span>
      </div>

      <div className="export-formats">
        <button
          type="button"
          className="btn-primary btn-block"
          disabled={!master || busy !== null}
          data-testid="download-png"
          onClick={() => void download('png')}
        >
          {busy === 'png' ? '…' : 'PNG'}
        </button>
        <button
          type="button"
          className="btn-secondary btn-block"
          disabled={!master || busy !== null}
          data-testid="download-svg"
          onClick={() => void download('svg')}
        >
          {busy === 'svg' ? '…' : 'SVG'}
        </button>
        <button
          type="button"
          className="btn-secondary btn-block"
          disabled={!master || busy !== null}
          data-testid="download-jpeg"
          onClick={() => void download('jpeg')}
        >
          {busy === 'jpeg' ? '…' : 'JPEG'}
        </button>
      </div>
    </div>
  );
}
