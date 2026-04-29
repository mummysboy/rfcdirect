import { useState } from 'react';

import { COLORS } from '@/lib/constants';

type Props = {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
};

// On web, `<input type="time">` is the platform-native time picker — Safari
// and mobile browsers render a wheel/dial; desktop Chrome/Firefox render a
// stepper. The wrapping label gives the whole row a tap target so users hit
// the picker even if they miss the input itself.
export function TimeInput({ value, onChange, disabled, ariaLabel }: Props) {
  const [focused, setFocused] = useState(false);
  const empty = !value;

  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        minHeight: 52,
        padding: '0 14px',
        borderRadius: 10,
        border: `1px solid ${focused ? COLORS.fg : COLORS.border}`,
        backgroundColor: COLORS.surface,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        boxSizing: 'border-box',
        transition: 'border-color 120ms ease',
      }}
    >
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        aria-label={ariaLabel}
        style={{
          flex: 1,
          minWidth: 0,
          padding: '12px 0',
          border: 'none',
          background: 'transparent',
          color: empty ? COLORS.muted : COLORS.fg,
          fontSize: 16,
          fontFamily: 'inherit',
          outline: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      />
    </label>
  );
}
