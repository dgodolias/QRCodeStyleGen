import { useEffect, useId, useState } from 'react';

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function expandHex(v: string): string {
  if (/^#[0-9a-f]{3}$/i.test(v)) {
    return '#' + v.slice(1).split('').map((c) => c + c).join('');
  }
  return v;
}

export function ColorField({
  value,
  onChange,
  label,
  testId,
}: {
  value: string;
  onChange: (hex: string) => void;
  label?: string;
  testId?: string;
}) {
  const id = useId();
  const [text, setText] = useState(value);

  // Keep the text field in sync when the value changes elsewhere.
  useEffect(() => setText(value), [value]);

  function commitText(v: string) {
    setText(v);
    if (HEX_RE.test(v.trim())) onChange(expandHex(v.trim()));
  }

  // The native picker only accepts #rrggbb.
  const pickerValue = HEX_RE.test(value) ? expandHex(value) : '#000000';

  return (
    <div className="field">
      {label && (
        <label className="lbl" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="color-field">
        <label
          className="swatch"
          style={{ background: value }}
          aria-label={`${label ?? 'Color'} swatch`}
        >
          <input
            id={id}
            type="color"
            value={pickerValue}
            onChange={(e) => {
              setText(e.target.value);
              onChange(e.target.value);
            }}
          />
        </label>
        <input
          className="hex"
          type="text"
          inputMode="text"
          spellCheck={false}
          value={text}
          data-testid={testId}
          onChange={(e) => commitText(e.target.value)}
          onBlur={() => setText(value)}
          aria-label={`${label ?? 'Color'} hex value`}
        />
      </div>
    </div>
  );
}
