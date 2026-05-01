import { Pressable, ScrollView, Text, View } from 'react-native';

import {
  CATEGORY_FILTERS,
  PLACEHOLDER_FILTERS,
  type CategoryFilter,
  type PlaceholderFilter,
} from '@/lib/constants';
import {
  categoryFilterLabels,
  copy,
  placeholderFilterLabels,
} from '@/lib/copy';

type Props = {
  selected: ReadonlySet<CategoryFilter>;
  onToggle: (filter: CategoryFilter) => void;
  placeholderMode: PlaceholderFilter | null;
  onPlaceholderToggle: (filter: PlaceholderFilter) => void;
};

export function CategoryFilters({
  selected,
  onToggle,
  placeholderMode,
  onPlaceholderToggle,
}: Props) {
  return (
    <View className="px-4 py-3">
      <Text className="mb-2 text-eyebrow uppercase tracking-eyebrow text-muted">
        {copy.home.filtersEyebrow}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingRight: 4 }}
      >
        {CATEGORY_FILTERS.map((filter) => {
          const isSelected = selected.has(filter);
          return (
            <Chip
              key={filter}
              label={categoryFilterLabels[filter]}
              selected={isSelected}
              onPress={() => onToggle(filter)}
            />
          );
        })}
        {PLACEHOLDER_FILTERS.map((filter) => {
          const isActive = placeholderMode === filter;
          return (
            <Chip
              key={filter}
              label={placeholderFilterLabels[filter]}
              selected={isActive}
              onPress={() => onPlaceholderToggle(filter)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={
        selected
          ? 'items-center rounded-full bg-fg px-4 py-2'
          : 'items-center rounded-full border border-border bg-surface px-4 py-2'
      }
    >
      <Text
        className={
          selected ? 'text-meta font-medium text-bg' : 'text-meta text-fg'
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}
