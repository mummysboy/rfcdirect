import { TextInput } from 'react-native';

import { COLORS } from '@/lib/constants';

type Props = {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
};

// Native fallback. A real wheel picker requires a dep (e.g.
// @react-native-community/datetimepicker); for v1 we keep this as a typed
// HH:MM input on iOS/Android until that dep gets wired up.
export function TimeInput({ value, onChange, disabled, ariaLabel }: Props) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder="HH:MM"
      placeholderTextColor={COLORS.muted}
      keyboardType="numbers-and-punctuation"
      editable={!disabled}
      accessibilityLabel={ariaLabel}
      className="rounded border border-border bg-surface px-3 py-3 text-body text-fg"
    />
  );
}
