import { Pressable, Text, View } from 'react-native';

import { copy } from '@/lib/copy';

type Props = {
  location: string;
  radius: number;
  /** `null` means a query is in flight; render the searching variant. */
  count: number | null;
  onPress: () => void;
};

const HEIGHT = 48;

export function CompactFiltersBar({ location, radius, count, onPress }: Props) {
  const label =
    count === null
      ? copy.home.filtersChipSearching(location, radius)
      : copy.home.filtersChipLabel(location, radius, count);
  const a11yLabel =
    count === null
      ? copy.home.filtersChipSearching(location, radius)
      : copy.home.filtersChipA11y(location, radius, count);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      style={{ height: HEIGHT }}
      className="flex-row items-center justify-between border-b border-border bg-surface px-4 active:bg-bg"
    >
      <Text
        numberOfLines={1}
        className="text-body text-fg"
        style={{ flex: 1, marginRight: 12 }}
      >
        {label}
      </Text>
      <View className="rounded-full border border-border px-3 py-1">
        <Text className="text-eyebrow uppercase tracking-eyebrow text-muted">
          {copy.home.filtersChipEdit}
        </Text>
      </View>
    </Pressable>
  );
}
