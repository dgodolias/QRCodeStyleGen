import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Content-Security-Policy injected as a <meta> fallback at BUILD time only.
// (In dev, Vite's HMR uses inline scripts, so a strict CSP would break it.)
// The authoritative CSP is served as an HTTP header via vercel.json / render.yaml;
// this meta is defense-in-depth for plain static hosting. `frame-ancestors`,
// `report-*` are header-only directives, so they live in the host config, not here.
const CSP_META = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "base-uri 'none'",
  "object-src 'none'",
  "form-action 'none'",
].join('; ');

function cspMetaPlugin(): Plugin {
  return {
    name: 'inject-csp-meta',
    apply: 'build',
    transformIndexHtml(html) {
      const tag = `<meta http-equiv="Content-Security-Policy" content="${CSP_META}">`;
      return html.replace('</title>', `</title>\n    ${tag}`);
    },
  };
}

// Static SPA build. No backend. Output -> dist/ (served identically on Vercel, Render
// AND GitHub Pages). base:'./' emits RELATIVE asset URLs so the same build works whether
// it's served from the domain root (Vercel/Render) or a project subpath
// (username.github.io/RepoName/ on GitHub Pages) — no rebuild per host.
// modulePreload.polyfill is disabled so Vite does NOT inject an inline <script> in index.html,
// which would otherwise violate our strict `script-src 'self'` CSP.
export default defineConfig({
  base: './',
  plugins: [react(), cspMetaPlugin()],
  build: {
    outDir: 'dist',
    target: 'es2020',
    sourcemap: false,
    modulePreload: { polyfill: false },
  },
  server: { port: 5173, strictPort: false },
  preview: { port: 4173, strictPort: false },
});
