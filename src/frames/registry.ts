import type { FrameDef, FrameRenderOpts, FrameCategory } from './types';

// ── Geometry helpers (all in the 0..1000 master author space) ──────────────

function cta(o: FrameRenderOpts, centerY: number): string {
  const baseline = centerY + o.ctaSize * 0.34;
  return `<text x="500" y="${baseline}" text-anchor="middle" font-family='${o.fontFamily}' font-size="${o.ctaSize}" font-weight="600" letter-spacing="0.5" fill="${o.ctaColor}">${o.ctaText}</text>`;
}

function star(cx: number, cy: number, r: number, color: string): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${color}"/>`;
}

function heart(cx: number, cy: number, size: number, color: string): string {
  const k = size / 32;
  const d =
    'M23.6,0c-3.4,0-6.3,2.7-7.6,5.6C14.7,2.7,11.8,0,8.4,0C3.8,0,0,3.8,0,8.4' +
    'c0,9.4,9.5,11.9,16,21.2c6.1-9.3,16-12.1,16-21.2C32,3.8,28.2,0,23.6,0z';
  return `<g transform="translate(${cx},${cy}) scale(${k.toFixed(3)}) translate(-16,-14.8)"><path d="${d}" fill="${color}"/></g>`;
}

function snowflake(cx: number, cy: number, r: number, color: string): string {
  let s = '';
  const sw = Math.max(2, r * 0.13);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI) / 3;
    const dx = r * Math.cos(a);
    const dy = r * Math.sin(a);
    s += `<line x1="${(cx - dx).toFixed(1)}" y1="${(cy - dy).toFixed(1)}" x2="${(cx + dx).toFixed(1)}" y2="${(cy + dy).toFixed(1)}" stroke="${color}" stroke-width="${sw.toFixed(1)}" stroke-linecap="round"/>`;
  }
  s += `<circle cx="${cx}" cy="${cy}" r="${(r * 0.16).toFixed(1)}" fill="${color}"/>`;
  return s;
}

function bat(cx: number, cy: number, size: number, color: string): string {
  const k = size / 100;
  const d =
    'M50,28 C44,14 33,16 28,24 C24,12 9,12 6,26 C17,22 18,33 27,34 ' +
    'C17,38 16,49 22,55 C29,46 41,48 50,42 C59,48 71,46 78,55 ' +
    'C84,49 83,38 73,34 C82,33 83,22 94,26 C91,12 76,12 72,24 C67,16 56,14 50,28 Z';
  return `<g transform="translate(${cx},${cy}) scale(${k.toFixed(3)}) translate(-50,-34)"><path d="${d}" fill="${color}"/></g>`;
}

// ── Frame registry ─────────────────────────────────────────────────────────

export const FRAMES: FrameDef[] = [
  // ───────────────────────── STANDARD ─────────────────────────
  {
    id: 'none',
    name: 'None',
    category: 'standard',
    qrSlot: { x: 0, y: 0, w: 1000, h: 1000 },
    cta: null,
    defaultColor: '#0a0a14',
    defaultTextColor: '#ffffff',
    render: () => '',
  },
  {
    id: 'rounded-band',
    name: 'Rounded card',
    category: 'standard',
    qrSlot: { x: 150, y: 110, w: 700, h: 700 },
    cta: { defaultText: 'SCAN ME', defaultSize: 62 },
    defaultColor: '#0a0a14',
    defaultTextColor: '#ffffff',
    render: (o) =>
      `<rect x="28" y="28" width="944" height="944" rx="64" fill="${o.frameColor}"/>` +
      `<rect x="84" y="84" width="832" height="752" rx="36" fill="#ffffff"/>` +
      cta(o, 905),
  },
  {
    id: 'corner-brackets',
    name: 'Brackets',
    category: 'standard',
    qrSlot: { x: 140, y: 120, w: 720, h: 720 },
    cta: { defaultText: 'SCAN ME', defaultSize: 50 },
    defaultColor: '#0a0a14',
    defaultTextColor: '#0a0a14',
    render: (o) => {
      const L = 150;
      const w = 18;
      const c = o.frameColor;
      const corner = (x: number, y: number, sx: number, sy: number) =>
        `<path d="M ${x} ${y + sy * L} L ${x} ${y} L ${x + sx * L} ${y}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
      return (
        corner(70, 70, 1, 1) +
        corner(930, 70, -1, 1) +
        corner(70, 880, 1, -1) +
        corner(930, 880, -1, -1) +
        cta(o, 920)
      );
    },
  },
  {
    id: 'top-ribbon',
    name: 'Top ribbon',
    category: 'standard',
    qrSlot: { x: 160, y: 260, w: 680, h: 680 },
    cta: { defaultText: 'SCAN ME', defaultSize: 58 },
    defaultColor: '#4078ff',
    defaultTextColor: '#ffffff',
    render: (o) =>
      `<path d="M150 80 H850 L810 150 L850 220 H150 L190 150 Z" fill="${o.frameColor}"/>` +
      `<path d="M150 220 L120 270 L150 250 Z" fill="${o.frameColor}" opacity="0.55"/>` +
      `<path d="M850 220 L880 270 L850 250 Z" fill="${o.frameColor}" opacity="0.55"/>` +
      cta(o, 152),
  },

  // ───────────────────────── HOLIDAYS ─────────────────────────
  {
    id: 'xmas-snowflakes',
    name: 'Christmas',
    category: 'holidays',
    qrSlot: { x: 165, y: 150, w: 670, h: 670 },
    cta: { defaultText: 'MERRY SCAN', defaultSize: 56 },
    defaultColor: '#c0392b',
    defaultTextColor: '#ffffff',
    render: (o) =>
      `<rect x="30" y="30" width="940" height="940" rx="60" fill="${o.frameColor}"/>` +
      `<rect x="92" y="120" width="816" height="724" rx="32" fill="#ffffff"/>` +
      snowflake(135, 90, 46, '#ffffff') +
      snowflake(865, 90, 46, '#ffffff') +
      snowflake(70, 500, 34, 'rgba(255,255,255,0.7)') +
      snowflake(930, 520, 34, 'rgba(255,255,255,0.7)') +
      cta(o, 905),
  },
  {
    id: 'valentine-hearts',
    name: 'Valentine',
    category: 'holidays',
    qrSlot: { x: 165, y: 150, w: 670, h: 670 },
    cta: { defaultText: 'SCAN WITH LOVE', defaultSize: 50 },
    defaultColor: '#e84393',
    defaultTextColor: '#ffffff',
    render: (o) =>
      `<rect x="30" y="30" width="940" height="940" rx="60" fill="${o.frameColor}"/>` +
      `<rect x="92" y="120" width="816" height="724" rx="32" fill="#ffffff"/>` +
      heart(125, 96, 78, '#ffffff') +
      heart(875, 96, 78, '#ffffff') +
      heart(70, 470, 50, 'rgba(255,255,255,0.8)') +
      heart(930, 470, 50, 'rgba(255,255,255,0.8)') +
      cta(o, 905),
  },
  {
    id: 'halloween-bats',
    name: 'Halloween',
    category: 'holidays',
    qrSlot: { x: 165, y: 175, w: 670, h: 670 },
    cta: { defaultText: 'SPOOKY SCAN', defaultSize: 54 },
    defaultColor: '#e67e22',
    defaultTextColor: '#1a1a1a',
    render: (o) =>
      `<rect x="30" y="30" width="940" height="940" rx="60" fill="${o.frameColor}"/>` +
      `<rect x="92" y="145" width="816" height="700" rx="32" fill="#ffffff"/>` +
      bat(135, 95, 150, '#1a1a1a') +
      bat(865, 95, 150, '#1a1a1a') +
      bat(500, 78, 110, '#1a1a1a') +
      cta(o, 905),
  },
  {
    id: 'newyear-confetti',
    name: 'New year',
    category: 'holidays',
    qrSlot: { x: 165, y: 270, w: 670, h: 670 },
    cta: { defaultText: 'CHEERS', defaultSize: 54 },
    defaultColor: '#1a1a2e',
    defaultTextColor: '#ffd700',
    render: (o) =>
      `<rect x="140" y="80" width="720" height="150" rx="28" fill="${o.frameColor}"/>` +
      star(120, 110, 26, '#ffd700') +
      star(900, 130, 22, '#f5a623') +
      star(80, 600, 20, '#ffd700') +
      star(940, 640, 24, '#f5a623') +
      star(500, 980, 18, '#ffd700') +
      cta(o, 158),
  },

  // ───────────────────────── EVENTS ─────────────────────────
  {
    id: 'ticket-stub',
    name: 'Ticket',
    category: 'events',
    qrSlot: { x: 215, y: 130, w: 570, h: 570 },
    cta: { defaultText: 'ADMIT ONE', defaultSize: 56 },
    defaultColor: '#6c5ce7',
    defaultTextColor: '#ffffff',
    render: (o) =>
      `<rect x="50" y="70" width="900" height="860" rx="44" fill="#ffffff" stroke="${o.frameColor}" stroke-width="8"/>` +
      `<line x1="90" y1="745" x2="910" y2="745" stroke="${o.frameColor}" stroke-width="6" stroke-dasharray="22 18" stroke-linecap="round"/>` +
      `<rect x="50" y="745" width="900" height="185" rx="44" fill="${o.frameColor}"/>` +
      `<rect x="50" y="745" width="900" height="60" fill="${o.frameColor}"/>` +
      cta(o, 840),
  },
  {
    id: 'phone-mockup',
    name: 'Phone',
    category: 'events',
    qrSlot: { x: 270, y: 215, w: 460, h: 460 },
    cta: { defaultText: 'TAP & SCAN', defaultSize: 46 },
    defaultColor: '#0a0a14',
    defaultTextColor: '#ffffff',
    render: (o) =>
      `<rect x="190" y="40" width="620" height="920" rx="86" fill="${o.frameColor}"/>` +
      `<rect x="230" y="95" width="540" height="770" rx="34" fill="#ffffff"/>` +
      `<rect x="430" y="60" width="140" height="22" rx="11" fill="#ffffff" opacity="0.65"/>` +
      `<rect x="420" y="905" width="160" height="14" rx="7" fill="#ffffff" opacity="0.5"/>` +
      cta(o, 770),
  },
  {
    id: 'badge-lanyard',
    name: 'Event badge',
    category: 'events',
    qrSlot: { x: 230, y: 250, w: 540, h: 540 },
    cta: { defaultText: 'CHECK IN', defaultSize: 52 },
    defaultColor: '#2d3436',
    defaultTextColor: '#ffffff',
    render: (o) =>
      `<rect x="430" y="40" width="140" height="70" rx="20" fill="${o.frameColor}"/>` +
      `<rect x="476" y="58" width="48" height="34" rx="12" fill="#ffffff"/>` +
      `<rect x="130" y="110" width="740" height="830" rx="46" fill="#ffffff" stroke="${o.frameColor}" stroke-width="10"/>` +
      `<rect x="130" y="820" width="740" height="120" rx="0" fill="${o.frameColor}"/>` +
      `<rect x="130" y="894" width="740" height="46" rx="46" fill="${o.frameColor}"/>` +
      cta(o, 880),
  },

  // ───────────────────────── THEMES ─────────────────────────
  {
    id: 'dashed-playful',
    name: 'Playful',
    category: 'themes',
    qrSlot: { x: 165, y: 150, w: 670, h: 670 },
    cta: { defaultText: 'SCAN ME!', defaultSize: 58 },
    defaultColor: '#00b894',
    defaultTextColor: '#00b894',
    render: (o) =>
      `<rect x="40" y="40" width="920" height="920" rx="80" fill="none" stroke="${o.frameColor}" stroke-width="16" stroke-dasharray="6 34" stroke-linecap="round"/>` +
      `<circle cx="120" cy="120" r="20" fill="${o.frameColor}"/>` +
      `<circle cx="880" cy="120" r="20" fill="${o.frameColor}"/>` +
      `<circle cx="120" cy="880" r="20" fill="${o.frameColor}"/>` +
      `<circle cx="880" cy="880" r="20" fill="${o.frameColor}"/>` +
      cta(o, 905),
  },
  {
    id: 'speech-bubble',
    name: 'Speech',
    category: 'themes',
    qrSlot: { x: 200, y: 135, w: 600, h: 600 },
    cta: { defaultText: 'SCAN ME', defaultSize: 56 },
    defaultColor: '#0984e3',
    defaultTextColor: '#ffffff',
    render: (o) =>
      `<rect x="50" y="50" width="900" height="800" rx="70" fill="${o.frameColor}"/>` +
      `<path d="M360 845 L300 960 L470 845 Z" fill="${o.frameColor}"/>` +
      `<rect x="110" y="110" width="780" height="620" rx="40" fill="#ffffff"/>` +
      cta(o, 795),
  },
];

export const FRAME_BY_ID: Record<string, FrameDef> = Object.fromEntries(
  FRAMES.map((f) => [f.id, f]),
);

export function getFrame(id: string): FrameDef {
  return FRAME_BY_ID[id] ?? FRAMES[0]!;
}

export function framesByCategory(cat: FrameCategory): FrameDef[] {
  return FRAMES.filter((f) => f.category === cat);
}

// ── Recently-used tracking (localStorage; local-only, privacy-safe) ─────────

const RECENT_KEY = 'qrsg.recentFrames';
const RECENT_MAX = 8;

export function getRecentFrameIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const ids = JSON.parse(raw) as unknown;
    if (!Array.isArray(ids)) return [];
    return ids.filter((id): id is string => typeof id === 'string' && id in FRAME_BY_ID);
  } catch {
    return [];
  }
}

export function pushRecentFrame(id: string): void {
  if (id === 'none' || !(id in FRAME_BY_ID)) return;
  try {
    const next = [id, ...getRecentFrameIds().filter((x) => x !== id)].slice(0, RECENT_MAX);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode - non-fatal */
  }
}
