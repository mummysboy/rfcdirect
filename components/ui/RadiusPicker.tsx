import { Pressable, Text, View } from 'react-native';

import { RADIUS_MILES } from '@/lib/constants';
import { copy } from '@/lib/copy';

const PRESETS: readonly number[] = [5, 10, 25, 50, 100];

type Props = {
  value: number;
  onChange: (miles: number) => void;
};

export function RadiusPicker({ value, onChange }: Props) {
  return (
    <View className="px-4 py-3">
      <Text className="mb-2 text-eyebrow uppercase tracking-eyebrow text-muted">
        {copy.home.radiusEyebrow}
      </Text>
      <View className="flex-row gap-2">
        {PRESETS.map((miles) => {
          const selected = miles === value;
          return (
            <Pressable
              key={miles}
              onPress={() => onChange(miles)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              className={
                selected
                  ? 'flex-1 items-center rounded-full bg-fg py-2'
                  : 'flex-1 items-center rounded-full border border-border bg-surface py-2'
              }
            >
              <Text
                className={
                  selected
                    ? 'text-meta font-medium text-bg'
                    : 'text-meta text-fg'
                }
              >
                {copy.home.radiusLabel(miles)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text className="sr-only">{`min ${RADIUS_MILES.min}, max ${RADIUS_MILES.max}`}</Text>
    </View>
  );
}
