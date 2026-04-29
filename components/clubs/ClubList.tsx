import { useEffect, useRef } from 'react';
import { FlatList } from 'react-native';

import type { ClubWithDistance } from '@/lib/queries';

import { ClubListItem } from './ClubListItem';

type Props = {
  clubs: ClubWithDistance[];
  selectedSlug?: string | null;
  onSelect?: (slug: string) => void;
  hideDistance?: boolean;
};

export function ClubList({ clubs, selectedSlug, onSelect, hideDistance }: Props) {
  const listRef = useRef<FlatList<ClubWithDistance>>(null);

  useEffect(() => {
    if (!selectedSlug) return;
    const index = clubs.findIndex((c) => c.slug === selectedSlug);
    if (index < 0) return;
    listRef.current?.scrollToIndex({
      index,
      animated: true,
      viewPosition: 0.1,
    });
  }, [selectedSlug, clubs]);

  return (
    <FlatList
      ref={listRef}
      data={clubs}
      keyExtractor={(c) => c.id}
      renderItem={({ item }) => (
        <ClubListItem
          club={item}
          selected={item.slug === selectedSlug}
          expanded={item.slug === selectedSlug}
          hideDistance={hideDistance}
          onPress={onSelect}
        />
      )}
      onScrollToIndexFailed={({ index }) => {
        // Variable row heights mean FlatList may not have measured the target
        // yet on the first attempt — retry on the next tick.
        setTimeout(() => {
          listRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.1,
          });
        }, 80);
      }}
    />
  );
}
