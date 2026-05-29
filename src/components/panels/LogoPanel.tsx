import { useRef, useState } from 'react';
import { useConfig, useConfigDispatch } from '../../state/ConfigContext';
import {
  validateAndSanitizeLogo,
  LOGO_REJECT_MESSAGE,
  MAX_LOGO_BYTES,
} from '../../security/validateLogo';
import { Switch } from '../Switch';

// Open-license (CC0) built-in glyphs — simple, original stroke icons. NOT brand logos.
const SAFE_ICONS: { id: string; label: string; path: string }[] = [
  { id: 'link', label: 'Link', path: '<path d="M9 15 L15 9 M10 7 L13 4 a4 4 0 0 1 6 6 l-3 3 M14 17 l-3 3 a4 4 0 0 1 -6 -6 l3 -3" fill="none" stroke="#0a0a14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' },
  { id: 'wifi', label: 'Wi-Fi', path: '<path d="M2 8 a15 15 0 0 1 20 0 M5 11.5 a10 10 0 0 1 14 0 M8 15 a5 5 0 0 1 8 0" fill="none" stroke="#0a0a14" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="19" r="1.6" fill="#0a0a14"/>' },
  { id: 'mail', label: 'Mail', path: '<rect x="3" y="5" width="18" height="14" rx="2.5" fill="none" stroke="#0a0a14" stroke-width="2"/><path d="M4 7 l8 6 l8 -6" fill="none" stroke="#0a0a14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' },
  { id: 'phone', label: 'Phone', path: '<path d="M6 3 h4 l2 5 -2.5 1.5 a11 11 0 0 0 5 5 L16 12 l5 2 v4 a2 2 0 0 1 -2 2 A16 16 0 0 1 4 5 a2 2 0 0 1 2 -2 Z" fill="none" stroke="#0a0a14" stroke-width="2" stroke-linejoin="round"/>' },
  { id: 'pin', label: 'Place', path: '<path d="M12 22 C7 16 4 12 4 9 a8 8 0 0 1 16 0 c0 3 -3 7 -8 13 Z" fill="none" stroke="#0a0a14" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="9" r="2.6" fill="#0a0a14"/>' },
  { id: 'heart', label: 'Heart', path: '<path d="M12 20 C4 14 3 9 6.5 6.5 C9 4.8 11 6 12 8 C13 6 15 4.8 17.5 6.5 C21 9 20 14 12 20 Z" fill="#0a0a14"/>' },
  { id: 'star', label: 'Star', path: '<path d="M12 3 l2.6 5.6 6.1 0.7 -4.5 4.1 1.2 6 -5.4 -3 -5.4 3 1.2 -6 -4.5 -4.1 6.1 -0.7 Z" fill="#0a0a14"/>' },
  { id: 'play', label: 'Play', path: '<circle cx="12" cy="12" r="9.5" fill="none" stroke="#0a0a14" stroke-width="2"/><path d="M10 8.5 l6 3.5 -6 3.5 Z" fill="#0a0a14"/>' },
];

const ICON_SVG = (inner: string, size = 256): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">${inner}</svg>`;

/** Rasterize one of our own trusted SVG icons to a PNG data URL, so the logo handed to
 *  the engine is always a clean PNG — same invariant as uploaded images. */
function iconToPngDataUrl(inner: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([ICON_SVG(inner)], { type: 'image/svg+xml' }));
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('no-2d');
        ctx.drawImage(img, 0, 0, 256, 256);
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        reject(e);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('icon-load'));
    };
    img.src = url;
  });
}

export function LogoPanel() {
  const cfg = useConfig();
  const dispatch = useConfigDispatch();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const res = await validateAndSanitizeLogo(file);
      if (res.ok && res.cleanDataUrl) {
        dispatch({
          type: 'SET_LOGO',
          value: {
            dataUrl: res.cleanDataUrl,
            name: file.name,
            size: 0.25,
            margin: 6,
            hideBackgroundDots: true,
          },
        });
      } else {
        setError(LOGO_REJECT_MESSAGE[res.reason ?? 'decode']);
      }
    } catch {
      setError(LOGO_REJECT_MESSAGE.decode);
    } finally {
      setBusy(false);
    }
  }

  async function pickIcon(inner: string, label: string) {
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await iconToPngDataUrl(inner);
      dispatch({
        type: 'SET_LOGO',
        value: { dataUrl, name: label, size: 0.25, margin: 6, hideBackgroundDots: true },
      });
    } catch {
      setError('Could not load icon.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel" data-testid="panel-logo">
      <div className="card stack">
        <div className="section-title">Logo</div>

        <div
          className={`dropzone${drag ? ' drag' : ''}`}
          role="button"
          tabIndex={0}
          data-testid="logo-dropzone"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            void handleFile(e.dataTransfer.files?.[0]);
          }}
        >
          <span className="dz-title">{busy ? 'Processing…' : 'Upload a logo'}</span>
          <span className="dz-sub">
            PNG, JPEG or WebP · max {Math.round(MAX_LOGO_BYTES / 1024 / 1024)} MB · stays in your
            browser
          </span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="visually-hidden"
          data-testid="logo-input"
          onChange={(e) => void handleFile(e.target.files?.[0] ?? undefined)}
        />

        {error && (
          <div className="notice danger" data-testid="logo-error">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <div className="field">
          <span className="lbl">Or pick an icon</span>
          <div className="icon-grid">
            {SAFE_ICONS.map((ic) => (
              <button
                type="button"
                key={ic.id}
                className="swatch-card"
                aria-label={ic.label}
                data-testid={`icon-${ic.id}`}
                onClick={() => void pickIcon(ic.path, ic.label)}
              >
                <span className="thumb" dangerouslySetInnerHTML={{ __html: ICON_SVG(ic.path, 24) }} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {cfg.logo && (
        <div className="card stack" data-testid="logo-settings">
          <div className="row-between">
            <div className="logo-preview">
              <img src={cfg.logo.dataUrl} alt="" />
              <div className="stack" style={{ gap: 2 }}>
                <span className="lbl" style={{ color: 'var(--ink)' }}>
                  {cfg.logo.name}
                </span>
                <span className="hint">Embedded locally</span>
              </div>
            </div>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '8px 16px' }}
              data-testid="logo-remove"
              onClick={() => dispatch({ type: 'SET_LOGO', value: null })}
            >
              Remove
            </button>
          </div>

          <div className="field">
            <span className="lbl">Logo size</span>
            <div className="range-row">
              <input
                type="range"
                min={0.1}
                max={0.35}
                step={0.01}
                value={cfg.logo.size}
                data-testid="logo-size"
                onChange={(e) => dispatch({ type: 'PATCH_LOGO', patch: { size: Number(e.target.value) } })}
              />
              <span className="val">{Math.round(cfg.logo.size * 100)}%</span>
            </div>
          </div>

          <div className="field">
            <span className="lbl">Logo padding</span>
            <div className="range-row">
              <input
                type="range"
                min={0}
                max={40}
                step={2}
                value={cfg.logo.margin}
                data-testid="logo-margin"
                onChange={(e) => dispatch({ type: 'PATCH_LOGO', patch: { margin: Number(e.target.value) } })}
              />
              <span className="val">{cfg.logo.margin}px</span>
            </div>
          </div>

          <Switch
            label="Hide dots behind logo"
            checked={cfg.logo.hideBackgroundDots}
            onChange={(v) => dispatch({ type: 'PATCH_LOGO', patch: { hideBackgroundDots: v } })}
            testId="logo-hide-dots"
          />
        </div>
      )}
    </div>
  );
}
