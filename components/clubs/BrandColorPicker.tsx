import { Pressable, Text, TextInput, View } from 'react-native';

import { BRAND_SWATCHES, COLORS } from '@/lib/constants';

type Props = {
  value: string | null | undefined;
  onChange: (hex: string | null) => void;
  error?: string;
};

export function BrandColorPicker({ value, onChange, error }: Props) {
  const current = (value ?? '').toLowerCase();

  return (
    <View>
      <View className="flex-row flex-wrap gap-2">
        {BRAND_SWATCHES.map((hex) => {
          const selected = current === hex.toLowerCase();
          return (
            <Pressable
              key={hex}
              onPress={() => onChange(hex)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Color ${hex}`}
              className={
                selected
                  ? 'h-10 w-10 rounded-full border-2 border-fg'
                  : 'h-10 w-10 rounded-full border border-border'
              }
              style={{ backgroundColor: hex }}
            />
          );
        })}
      </View>

      <View className="mt-3 flex-row items-center gap-3">
        <View
          className="h-10 w-10 rounded-full border border-border"
          style={{ backgroundColor: current || COLORS.surface }}
        />
        <TextInput
          value={value ?? ''}
          onChangeText={(t) => onChange(t === '' ? null : t)}
          placeholder="#1A1A1A"
          placeholderTextColor={COLORS.muted}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={7}
          className="flex-1 rounded border border-border bg-bg px-3 py-2 text-body text-fg"
        />
      </View>

      {error ? (
        <Text className="mt-1 text-meta text-accent">{error}</Text>
      ) : null}
    </View>
  );
}
