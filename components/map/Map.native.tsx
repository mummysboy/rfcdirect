import { Text, View } from 'react-native';

import type { ClubWithDistance } from '@/lib/queries';

type Props = {
  center?: { lng: number; lat: number };
  radiusMiles: number;
  clubs: ClubWithDistance[];
  onPinPress?: (slug: string) => void;
};

// Native map is not yet wired up — `@rnmapbox/maps` is in deps but the
// download token plugin opt is not configured, so iOS/Android builds need
// extra setup. The list view below the map still works on native.
export function Map({ clubs }: Props) {
  return (
    <View className="flex-1 items-center justify-center bg-bg px-4">
      <Text className="text-center text-meta text-muted">
        Map view is web-only for now ({clubs.length}{' '}
        {clubs.length === 1 ? 'club' : 'clubs'} below).
      </Text>
    </View>
  );
}
