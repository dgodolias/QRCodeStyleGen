# Security policy

## Threat model

QR Style Studio is a **fully client-side** static web app. There is no server, no database,
and no user accounts, so the classic server-side attack surface (auth, injection into a
backend, SSRF, stored XSS) does not exist. The relevant surface is entirely **in the browser**:

| Vector | Risk | Mitigation |
| --- | --- | --- |
| Logo image upload | Malicious SVG / polyglot / oversized file → XSS or memory abuse | Allow-list PNG/JPEG/WebP only; verify **magic bytes** (not just MIME/extension); enforce ≤ 2 MB and ≤ 2048×2048; **re-encode through a canvas** to discard EXIF/ICC/trailing payloads. See `src/security/validateLogo.ts`. |
| Additional text / CTA text | Injection into the serialized export SVG | Length-capped and **XML-escaped** (`src/security/escapeXml.ts`) before insertion. Control characters stripped. |
| SVG entering the DOM (preview) | mutation XSS via crafted SVG | Single choke point through **DOMPurify** with the SVG profile, `script`/`foreignObject` and event handlers forbidden (`sanitizeSvgForDom`). |
| QR payload | A scanner auto-opening `javascript:`/`data:`/`file:` | **Soft warning**, not a block — the user owns their QR. |
| Third-party requests | IP/data leakage, CSP bypass | **No external origins.** Fonts self-hosted; strict CSP (`default-src 'self'`). |
| Supply chain | Malicious dependency | Minimal deps, committed lockfile, `npm ci`, weekly Dependabot, `npm audit`. |

## Content-Security-Policy

Served as an HTTP header (`vercel.json`, `render.yaml`) and a build-time `<meta>` fallback:

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self';
connect-src 'self';
frame-ancestors 'none';
base-uri 'none';
object-src 'none';
form-action 'none';
```

`style-src` allows `'unsafe-inline'` because Vite injects a small inline stylesheet; there is
no inline or external **script**, so script injection remains fully blocked.

## Reporting a vulnerability

Please open a private security advisory on the repository, or email the maintainer. Include
reproduction steps and the affected version/commit. We aim to acknowledge within a few days.
