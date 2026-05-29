import type { ReactNode } from 'react';

export interface SwatchOption<T extends string> {
  value: T;
  label: string;
  icon: ReactNode;
}

export function SwatchPicker<T extends string>({
  label,
  options,
  value,
  onSelect,
  testIdPrefix,
}: {
  label: string;
  options: SwatchOption<T>[];
  value: T;
  onSelect: (v: T) => void;
  testIdPrefix?: string;
}) {
  return (
    <div className="field">
      <span className="lbl">{label}</span>
      <div className="swatch-grid" role="radiogroup" aria-label={label}>
        {options.map((opt) => (
          <button
            type="button"
            key={opt.value}
            role="radio"
            aria-checked={value === opt.value}
            aria-label={opt.label}
            className={`swatch-card${value === opt.value ? ' active' : ''}`}
            data-testid={testIdPrefix ? `${testIdPrefix}-${opt.value}` : undefined}
            onClick={() => onSelect(opt.value)}
          >
            <span className="thumb">{opt.icon}</span>
            <span className="cap">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
