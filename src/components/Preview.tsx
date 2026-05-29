import { useMemo } from 'react';
import { sanitizeSvgForDom } from '../compositor/serializeMasterSvg';
import type { MasterState } from './useMasterSvg';

/** Renders the composed master SVG into the live DOM. This is the one place SVG enters
 *  innerHTML, so it goes through DOMPurify (sanitizeSvgForDom) first. */
export function Preview({ master, error }: MasterState) {
  const html = useMemo(() => (master ? sanitizeSvgForDom(master.svg) : ''), [master]);

  return (
    <div className="preview-stage" data-testid="preview-stage">
      {master ? (
        <div
          className="preview-svg"
          data-testid="preview-svg"
          // Safe: built from a trusted template + pre-escaped text + trusted-engine QR,
          // then DOMPurify-sanitized above.
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <div className="status">
          {error ? `Could not generate: ${error}` : 'Enter content to generate your QR code'}
        </div>
      )}
    </div>
  );
}
