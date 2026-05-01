import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

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
  const parts: string[] = [];
  if (club.year_founded) parts.push(copy.club.foundedLabel(club.year_founded));
  parts.push(categoryLabels[club.category as keyof typeof categoryLabels] ?? club.category);
  parts.push(divisionLabels[club.division as keyof typeof divisionLabels] ?? club.division);
  return parts.join(' · ');
}

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

const EXPAND_DURATION = 280;
const COLLAPSE_DURATION = 220;
// Decelerating curve — fast at the start, settles gently. Feels like the
// panel is "landing" rather than mechanically traveling at constant speed.
const EXPAND_EASING = Easing.bezier(0.16, 1, 0.3, 1);
// Mirror curve for collapse: starts gentle, accelerates out.
const COLLAPSE_EASING = Easing.bezier(0.7, 0, 0.84, 0);

export function ClubListItem({
  club,
  selected,
  expanded,
  hideDistance,
  onPress,
}: Props) {
  // -1 means "not yet measured" — animatedStyle leaves height unset so a
  // re-mounted, already-expanded row renders at its natural size with no
  // collapse flicker.
  const heightSV = useSharedValue<number>(expanded ? -1 : 0);
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);
  // Once a row has been opened, keep ClubExpanded mounted so subsequent
  // toggles animate from a known height (no measure flash).
  const hasOpenedRef = useRef(!!expanded);
  if (expanded) hasOpenedRef.current = true;
  // True only when the row was *already* expanded at mount time (FlatList
  // virtualization re-mount). Used to skip the initial animation in that
  // case — the user didn't trigger it.
  const wasInitiallyExpanded = useRef(!!expanded);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (measuredHeight === null) return;
    const target = expanded ? measuredHeight : 0;

    if (!hasInitialized.current) {
      hasInitialized.current = true;
      if (wasInitiallyExpanded.current) {
        heightSV.value = target;
        return;
      }
    }

    heightSV.value = withTiming(target, {
      duration: expanded ? EXPAND_DURATION : COLLAPSE_DURATION,
      easing: expanded ? EXPAND_EASING : COLLAPSE_EASING,
    });
  }, [expanded, measuredHeight, heightSV]);

  const wrapperStyle = useAnimatedStyle(() => {
    if (heightSV.value < 0) return {};
    return { height: heightSV.value };
  });

  const onContentLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h <= 0 || h === measuredHeight) return;
    setMeasuredHeight(h);
  };

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
        {club.logo_url ? (
          <Image
            source={club.logo_url}
            contentFit="cover"
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF' }}
            accessibilityLabel={`${club.name} logo`}
          />
        ) : (
          <View className="h-10 w-10 items-center justify-center rounded-full bg-bg">
            <Text className="font-serif text-h2 text-fg">{initial(club.name)}</Text>
          </View>
        )}
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
      {hasOpenedRef.current ? (
        <Animated.View style={[{ overflow: 'hidden' }, wrapperStyle]}>
          <View onLayout={onContentLayout}>
            <ClubExpanded club={club} />
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}
