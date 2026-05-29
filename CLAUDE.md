# QR Style Studio - project guide

A free, **100% client-side**, open-source QR code **style** generator (Vite + React + TS).
Clones the styling features of me-qr.com (shapes, frames, logo, additional text), with a
strong privacy/security posture. No backend; deploys as a static site to Vercel or Render.

## Commands

- `npm run dev` - dev server (http://localhost:5173)
- `npm run build` - type-check (`tsc --noEmit`) + `vite build` → `dist/`
- `npm run preview` - serve the production build on :4173
- `npm test` - Playwright suites (builds + previews automatically; needs `npx playwright install chromium` once)
- `npm run lint` - type-check only

## Architecture

The final downloadable image is **one master SVG** = decorative **frame** + styled **QR**
+ **additional text**, composed in `src/compositor/serializeMasterSvg.ts`.

- `src/qr/` - `types.ts` (the `QRConfig` shape), `engine.ts` (wraps `qr-code-styling`:
  `type:'svg'`, `saveAsBlob:true` so the logo is an inline base64 data URL).
- `src/compositor/serializeMasterSvg.ts` - injects the QR's inner nodes into a `<g>` inside
  the frame at `qrSlot` coords; **id-namespaces** QR vs frame to avoid gradient/clip clashes;
  appends the additional-text `<text>`. `sanitizeSvgForDom()` is the **only** DOMPurify call.
- `src/frames/` - `types.ts` (`FrameDef`) + `registry.ts` (14 frames, pure SVG, + recent-used
  localStorage helpers). Author space is a fixed `0..1000` grid.
- `src/lib/export.ts` - SVG/PNG/JPEG export. Rasterizes master SVG → Blob URL → `<img>` →
  canvas @scale. Preloads the bundled font (`document.fonts.load`) before drawing; flattens a
  white background for JPEG.
- `src/lib/ecl.ts` - error-correction advice (logo ⇒ recommend `H`).
- `src/security/` - `validateLogo.ts` (MIME + magic bytes + dims + canvas re-encode),
  `escapeXml.ts` (the single text-escaping barrier), `inspectQrContent.ts` (soft scheme/length
  warnings).
- `src/state/` - `useReducer` + split state/dispatch Context; config persisted to localStorage
  (logo is **session-only**, never persisted). `useDebounced` throttles the engine.
- `src/components/` - `App.tsx`, `Preview.tsx`, `ExportBar.tsx`, shared controls, and
  `panels/` (Content, Shapes, Frames, Logo, AdditionalText). `useMasterSvg.ts` derives the
  composed SVG from debounced config.
- `src/styles/stitch/` - the **stitch** design system (verbatim tokens/components), with the
  font stack adapted to self-hosted Inter.

## Conventions & invariants

- **Never** hand a raw uploaded `File` to the engine - only the canvas-re-encoded data URL.
- **Never** interpolate raw user text into an SVG string - always `escapeXml` first.
- Frames are **pure SVG** (no `<image>`, no external URLs, no script). Keep author coords in
  `0..1000`; declare a square `qrSlot`.
- Keep dependencies minimal; CSP must stay `script-src 'self'` (no inline/CDN scripts - see
  `vite.config.ts` `modulePreload.polyfill:false`).

## Deploy

`vercel.json` and `render.yaml` carry the build config, SPA rewrite, and the authoritative
security headers (CSP, HSTS, nosniff, frame-ancestors none, etc.).
