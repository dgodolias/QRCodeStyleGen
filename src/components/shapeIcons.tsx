import type { DotType, CornerSquareType, CornerDotType } from '../qr/types';

const F = '#0a0a14';

function Box({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
      {children}
    </svg>
  );
}

export function DotIcon({ type }: { type: DotType }) {
  switch (type) {
    case 'square':
      return <Box><rect x="5" y="5" width="14" height="14" fill={F} /></Box>;
    case 'rounded':
      return <Box><rect x="5" y="5" width="14" height="14" rx="4" fill={F} /></Box>;
    case 'extra-rounded':
      return <Box><rect x="5" y="5" width="14" height="14" rx="7" fill={F} /></Box>;
    case 'dots':
      return <Box><circle cx="12" cy="12" r="7" fill={F} /></Box>;
    case 'classy':
      return <Box><path d="M10 5 H19 V14 A5 5 0 0 1 14 19 H5 V10 A5 5 0 0 1 10 5 Z" fill={F} /></Box>;
    case 'classy-rounded':
      return <Box><path d="M11 5 H19 V13 A6 6 0 0 1 13 19 H5 V11 A6 6 0 0 1 11 5 Z" fill={F} /></Box>;
  }
}

export function CornerSquareIcon({ type }: { type: CornerSquareType }) {
  if (type === 'dot') {
    return (
      <Box>
        <circle cx="12" cy="12" r="8.5" fill="none" stroke={F} strokeWidth="3" />
        <circle cx="12" cy="12" r="3" fill={F} />
      </Box>
    );
  }
  const rx = type === 'extra-rounded' ? 6 : 0;
  return (
    <Box>
      <rect x="3.5" y="3.5" width="17" height="17" rx={rx} fill="none" stroke={F} strokeWidth="3" />
      <rect x="9" y="9" width="6" height="6" rx={rx ? 2 : 0} fill={F} />
    </Box>
  );
}

export function CornerDotIcon({ type }: { type: CornerDotType }) {
  return type === 'dot' ? (
    <Box><circle cx="12" cy="12" r="5.5" fill={F} /></Box>
  ) : (
    <Box><rect x="7" y="7" width="10" height="10" fill={F} /></Box>
  );
}
