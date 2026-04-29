import { Pressable, Text, View } from 'react-native';

import { categoryLabels, copy, divisionLabels } from '@/lib/copy';
import type { ClubWithDistance } from '@/lib/queries';

import { ClubExpanded } from './ClubExpanded';

type Props = {
  club: ClubWithDistance;
  selected?: boolean;
  expanded?: boolean;
  /** Hide the distance label — useful when the row is shown without a search center. */
  hideDistance?: boolean;
  onPress?: (slug: string) => void;
};

function metaLine(club: ClubWithDistance): string {
  const parts: string[] = [
    divisionLabels[club.division as keyof typeof divisionLabels] ?? club.division,
    categoryLabels[club.category as keyof typeof categoryLabels] ?? club.category,
  ];
  if (club.year_founded) parts.push(copy.club.foundedLabel(club.year_founded));
  return parts.join(' · ');
}

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

export function ClubListItem({
  club,
  selected,
  expanded,
  hideDistance,
  onPress,
}: Props) {
  return (
    <View className={selected ? 'border-l-4 border-l-accent' : ''}>
      <Pressable
        onPress={() => onPress?.(club.slug)}
        accessibilityRole="button"
        accessibilityState={{ selected: !!selected, expanded: !!expanded }}
        className={`flex-row items-center gap-3 border-b border-border py-3 active:bg-bg ${
          selected ? 'bg-bg pl-3 pr-4' : 'bg-surface px-4'
        }`}
      >
        <View className="h-10 w-10 items-center justify-center rounded-full bg-bg">
          <Text className="font-serif text-h2 text-fg">{initial(club.name)}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-body font-medium text-fg" numberOfLines={1}>
            {club.name}
          </Text>
          <Text className="text-meta text-muted" numberOfLines={1}>
            {metaLine(club)}
          </Text>
        </View>
        {hideDistance ? null : (
          <Text className="text-eyebrow uppercase tracking-eyebrow text-muted">
            {copy.club.distanceLabel(club.distance_miles)}
          </Text>
        )}
      </Pressable>
      {expanded ? <ClubExpanded slug={club.slug} /> : null}
    </View>
  );
}
