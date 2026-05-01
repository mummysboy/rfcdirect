import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type ReactElement,
} from 'react';
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import type { ClubWithDistance } from '@/lib/queries';

import { ClubListItem } from './ClubListItem';

type Props = {
  clubs: ClubWithDistance[];
  selectedSlug?: string | null;
  onSelect?: (slug: string) => void;
  hideDistance?: boolean;
  header?: ReactElement | null;
  empty?: ReactElement | null;
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export type ClubListHandle = {
  scrollToTop: () => void;
};

export const ClubList = forwardRef<ClubListHandle, Props>(function ClubList(
  {
    clubs,
    selectedSlug,
    onSelect,
    hideDistance,
    header,
    empty,
    onScroll,
    contentContainerStyle,
  },
  ref,
) {
  const listRef = useRef<FlatList<ClubWithDistance>>(null);

  useImperativeHandle(
    ref,
    () => ({
      scrollToTop: () =>
        listRef.current?.scrollToOffset({ offset: 0, animated: true }),
    }),
    [],
  );

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
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentContainerStyle={contentContainerStyle}
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
});
