import { useEffect, useRef, useState } from 'react';
import { useDebounced } from '../state/useDebounced';
import { renderQrSvgString } from '../qr/engine';
import { buildMasterSvg, type MasterSvg } from '../compositor/serializeMasterSvg';
import { getFrame } from '../frames/registry';
import { escapeXml } from '../security/escapeXml';
import { MAX_CTA_TEXT, MAX_ADDITIONAL_TEXT } from '../constants';
import type { QRConfig } from '../qr/types';

export interface MasterState {
  master: MasterSvg | null;
  error: string | null;
}

/** Derives the composed master SVG from the (debounced) config. Async because the QR
 *  engine renders headlessly; stale results are dropped via a monotonic sequence id. */
export function useMasterSvg(config: QRConfig): MasterState {
  const debounced = useDebounced(config, 160);
  const [state, setState] = useState<MasterState>({ master: null, error: null });
  const seq = useRef(0);

  useEffect(() => {
    const id = ++seq.current;
    if (!debounced.data.trim()) {
      setState({ master: null, error: null });
      return;
    }
    let cancelled = false;

    void (async () => {
      try {
        const qrSvg = await renderQrSvgString(debounced);
        if (cancelled || id !== seq.current) return;

        const frame = getFrame(debounced.frame.id);
        const at = debounced.additionalText;
        const master = buildMasterSvg({
          qrSvg,
          frame,
          dotScale: debounced.dotScale,
          frameStyle: {
            color: debounced.frame.color,
            textColor: debounced.frame.textColor,
            ctaText: escapeXml(debounced.frame.ctaText, MAX_CTA_TEXT),
            ctaSize: debounced.frame.ctaSize,
          },
          additionalText:
            at && at.text.trim()
              ? {
                  text: escapeXml(at.text, MAX_ADDITIONAL_TEXT),
                  font: at.font,
                  size: at.size,
                  color: at.color,
                }
              : null,
        });

        if (!cancelled && id === seq.current) setState({ master, error: null });
      } catch (e) {
        if (!cancelled && id === seq.current) {
          setState({ master: null, error: e instanceof Error ? e.message : 'Generation failed' });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debounced]);

  return state;
}
