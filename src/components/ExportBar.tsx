import { useState } from 'react';
import { exportArtifact } from '../lib/export';
import type { ExportFormat } from '../qr/types';
import type { MasterSvg } from '../compositor/serializeMasterSvg';

const SCALES = [1, 2, 3, 4];
const FORMATS: { id: ExportFormat; label: string; hint: string }[] = [
  { id: 'png', label: 'PNG', hint: 'Best for web & sharing (transparent background)' },
  { id: 'svg', label: 'SVG', hint: 'Vector - infinite resolution, ideal for print' },
  { id: 'jpeg', label: 'JPEG', hint: 'Smaller file, white background' },
];

export function ExportBar({ master }: { master: MasterSvg | null }) {
  const [scale, setScale] = useState(3);
  const [format, setFormat] = useState<ExportFormat>('png');
  const [fileName, setFileName] = useState('qr-code');
  const [busy, setBusy] = useState(false);

  const isRaster = format !== 'svg';
  const activeFormat = FORMATS.find((f) => f.id === format)!;

  async function handleDownload() {
    if (!master || busy) return;
    setBusy(true);
    try {
      await exportArtifact(master, format, { scale, fileName });
    } catch {
      /* surfaced to console; UI stays responsive */
    } finally {
      setBusy(false);
    }
  }

  const ext = format === 'jpeg' ? 'jpg' : format;

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
        <span className="lbl">Format</span>
        <div className="seg-inline" role="group" aria-label="Export format">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={format === f.id ? 'active' : ''}
              data-testid={`format-${f.id}`}
              aria-pressed={format === f.id}
              onClick={() => setFormat(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="hint">{activeFormat.hint}</span>
      </div>

      {isRaster && (
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
          <span className="hint">{1000 * scale}px wide</span>
        </div>
      )}

      <button
        type="button"
        className="btn-primary btn-block download-btn"
        disabled={!master || busy}
        data-testid="download-button"
        onClick={() => void handleDownload()}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5M5 19.5h14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {busy ? 'Preparing…' : `Download .${ext}`}
      </button>
    </div>
  );
}
