# QR Style Studio

A free, open-source QR code **style** generator that runs **100% in your browser**.
Design beautiful, scannable QR codes — custom dot shapes, decorative frames, a center
logo, and additional text — then export as PNG, SVG, or JPEG.

No backend. No accounts. No tracking. Your content, your logo, and your design **never
leave your device**.

> Inspired by the styling features of me-qr.com, rebuilt as a privacy-first, static,
> open-source app you can self-host anywhere.

## Features

- **Shapes** — 6 dot styles (square, rounded, dots, classy, classy-rounded, extra-rounded),
  3 corner-frame styles, 2 corner-center styles, each independently colorable.
- **Colors & gradients** — flat or two-stop linear/radial gradients for dots, corners, and
  background.
- **Frames** — 14 curated frames across Standard / Holidays / Events / Themes, each with a
  customizable call-to-action band (text, color, size). "Recently used" remembered locally.
- **Logo** — upload your own (PNG/JPEG/WebP) or pick a built-in open-license icon. Auto-raises
  error correction to **H** so the code stays scannable; toggle "hide dots behind logo".
- **Additional text** — a caption below the code with font, size, and color controls.
- **Export** — PNG / JPEG at 1×–4× resolution, or infinite-scale SVG.
- **Live preview** — vector preview updates as you type.

## Privacy & security

This app is **fully client-side**. There is no server to send anything to.

- **No uploads, no tracking, no analytics, no cookies.** Nothing is fetched at runtime
  except the page's own bundled assets.
- **Logo uploads are validated and sanitized** in the browser: type allow-list (PNG/JPEG/WebP
  only — SVG is rejected), **magic-byte** verification (a renamed `.svg`→`.png` is caught),
  size & dimension limits, then a **canvas re-encode** that strips EXIF/ICC and any trailing
  payload before the image is ever used.
- **All user text is XML-escaped** before it enters the exported SVG, so it cannot inject
  markup or script.
- **Strict Content-Security-Policy** (`script-src 'self'`, `font-src 'self'`, no external
  origins) shipped as HTTP headers (`vercel.json` / `render.yaml`) and a build-time `<meta>`
  fallback. Fonts are **self-hosted** (Inter), so no Google Fonts CDN and no IP leakage.
- **DOMPurify** sanitizes the one place SVG enters the live DOM (the preview), as
  defense-in-depth.
- Dangerous QR payloads (`javascript:`, `data:`, …) trigger a **soft warning**, not a block —
  it's your QR.

See [`SECURITY.md`](SECURITY.md) for the threat model and how to report issues.

## Tech stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + TypeScript — static SPA
- [`qr-code-styling`](https://github.com/kozakdenys/qr-code-styling) — the QR rendering engine
- [DOMPurify](https://github.com/cure53/DOMPurify) — SVG sanitization
- UI built on the **stitch** design system (Google-product look, glassmorphism)
- Tests: [Playwright](https://playwright.dev/) + [jsQR](https://github.com/cozmo/jsQR)
  (decodes the generated code to prove it still scans)

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build -> dist/
npm run preview    # serve the production build on :4173
```

### Tests

```bash
npx playwright install chromium   # one-time
npm test                          # feature + security + scannability suites
```

## Deploy (free tier)

The build is a pure static site (`dist/`), so it deploys identically to either host.

**Vercel** — import the repo; `vercel.json` sets the build command, SPA rewrite, and security
headers automatically.

**Render** — New → Blueprint (uses `render.yaml`), or New → Static Site with
build `npm ci && npm run build` and publish dir `dist`.

**GitHub Pages** — fully supported (the app is client-side, so no server is needed).
Repo → Settings → Pages → Source = **GitHub Actions**; the included
`.github/workflows/deploy-pages.yml` builds and publishes on every push. The build uses
`base: './'` (relative asset URLs), so it works from the project subpath
(`username.github.io/RepoName/`) with no changes.
Note: GitHub Pages cannot set custom HTTP response headers, so the HSTS / `X-Frame-Options`
/ `frame-ancestors` headers from `vercel.json` / `render.yaml` do not apply there — only the
build-time CSP `<meta>` (which still blocks inline/external scripts). For the strongest
header posture, prefer Vercel or Render.

## License

[MIT](LICENSE) © 2026 dgodolias
