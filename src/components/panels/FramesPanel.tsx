import { useMemo, useState } from 'react';
import { useConfig, useConfigDispatch } from '../../state/ConfigContext';
import {
  FRAMES,
  getFrame,
  framesByCategory,
  getRecentFrameIds,
  pushRecentFrame,
} from '../../frames/registry';
import { FRAME_CATEGORIES, type FrameCategory, type FrameDef } from '../../frames/types';
import { sanitizeSvgForDom } from '../../compositor/serializeMasterSvg';
import { ColorField } from '../ColorField';
import { MAX_CTA_TEXT } from '../../constants';

type Filter = 'all' | FrameCategory | 'recent';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  ...FRAME_CATEGORIES.map((c) => ({ id: c.id as Filter, label: c.label })),
  { id: 'recent', label: 'Recently used' },
];

/** Static thumbnail markup per frame: the frame drawn with its default colors plus a
 *  grey placeholder in the QR slot. Computed once - independent of live config. */
function buildThumb(def: FrameDef): string {
  const opts = {
    frameColor: def.defaultColor,
    ctaText: def.cta?.defaultText ?? '',
    ctaColor: def.defaultTextColor,
    ctaSize: def.cta?.defaultSize ?? 56,
    fontFamily: '"Inter", system-ui, sans-serif',
  };
  const slot = def.qrSlot;
  const placeholder =
    `<rect x="${slot.x}" y="${slot.y}" width="${slot.w}" height="${slot.h}" rx="18" fill="#c9ccd6"/>` +
    `<rect x="${slot.x + slot.w * 0.12}" y="${slot.y + slot.h * 0.12}" width="${slot.w * 0.16}" height="${slot.h * 0.16}" fill="#8b90a0"/>` +
    `<rect x="${slot.x + slot.w * 0.72}" y="${slot.y + slot.h * 0.12}" width="${slot.w * 0.16}" height="${slot.h * 0.16}" fill="#8b90a0"/>` +
    `<rect x="${slot.x + slot.w * 0.12}" y="${slot.y + slot.h * 0.72}" width="${slot.w * 0.16}" height="${slot.h * 0.16}" fill="#8b90a0"/>`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="100%" height="100%">` +
    def.render(opts) +
    placeholder +
    `</svg>`;
  return sanitizeSvgForDom(svg);
}

export function FramesPanel() {
  const cfg = useConfig();
  const dispatch = useConfigDispatch();
  const [filter, setFilter] = useState<Filter>('all');

  const thumbs = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of FRAMES) map.set(f.id, buildThumb(f));
    return map;
  }, []);

  const shown: FrameDef[] = useMemo(() => {
    if (filter === 'all') return FRAMES;
    if (filter === 'recent') return getRecentFrameIds().map(getFrame);
    return framesByCategory(filter);
  }, [filter]);

  const current = getFrame(cfg.frame.id);

  function select(id: string) {
    dispatch({ type: 'SELECT_FRAME', id });
    pushRecentFrame(id);
  }

  return (
    <div className="panel" data-testid="panel-frames">
      <div className="card stack">
        <div className="section-title">Frame</div>

        <div className="subtabs" role="tablist" aria-label="Frame categories">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={filter === f.id ? 'active' : ''}
              data-testid={`frame-filter-${f.id}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <div className="status">No frames yet - pick one to see it here.</div>
        ) : (
          <div className="swatch-grid frames">
            {shown.map((f) => (
              <button
                type="button"
                key={f.id}
                className={`swatch-card${cfg.frame.id === f.id ? ' active' : ''}`}
                data-testid={`frame-${f.id}`}
                aria-label={f.name}
                onClick={() => select(f.id)}
              >
                <span
                  className="thumb"
                  dangerouslySetInnerHTML={{ __html: thumbs.get(f.id) ?? '' }}
                />
                <span className="cap">{f.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {current.cta && cfg.frame.id !== 'none' && (
        <div className="card stack" data-testid="frame-cta-controls">
          <div className="section-title">Call to action</div>
          <div className="field">
            <label className="lbl" htmlFor="cta-text">
              Text
            </label>
            <input
              id="cta-text"
              className="input"
              type="text"
              maxLength={MAX_CTA_TEXT}
              value={cfg.frame.ctaText}
              data-testid="input-cta"
              onChange={(e) => dispatch({ type: 'PATCH_FRAME', patch: { ctaText: e.target.value } })}
            />
          </div>
          <div className="field">
            <span className="lbl">Text size</span>
            <div className="range-row">
              <input
                type="range"
                min={24}
                max={110}
                step={2}
                value={cfg.frame.ctaSize}
                data-testid="input-cta-size"
                onChange={(e) =>
                  dispatch({ type: 'PATCH_FRAME', patch: { ctaSize: Number(e.target.value) } })
                }
              />
              <span className="val">{cfg.frame.ctaSize}px</span>
            </div>
          </div>
          <div className="field-row">
            <ColorField
              label="Frame color"
              value={cfg.frame.color}
              onChange={(c) => dispatch({ type: 'PATCH_FRAME', patch: { color: c } })}
              testId="cta-frame-color"
            />
            <ColorField
              label="Text color"
              value={cfg.frame.textColor}
              onChange={(c) => dispatch({ type: 'PATCH_FRAME', patch: { textColor: c } })}
              testId="cta-text-color"
            />
          </div>
        </div>
      )}
    </div>
  );
}
