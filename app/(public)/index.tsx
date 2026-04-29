import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { ClubList } from '@/components/clubs/ClubList';
import { Container } from '@/components/ui/Container';
import { RadiusPicker } from '@/components/ui/RadiusPicker';
import { RADIUS_MILES } from '@/lib/constants';
import { copy } from '@/lib/copy';
import { listClubsWithinRadius, type ClubWithDistance } from '@/lib/queries';

// Until the Mapbox geocoder is wired, the search center is hardcoded.
// San Jose, CA — matches the v1 demo flow in README.md.
const HARDCODED_CENTER = {
  label: 'San Jose, CA',
  lat: 37.3382,
  lng: -121.8863,
};

export default function HomeScreen() {
  const [radius, setRadius] = useState<number>(RADIUS_MILES.default);
  const [clubs, setClubs] = useState<ClubWithDistance[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setClubs(null);
    setError(null);
    listClubsWithinRadius({
      lat: HARDCODED_CENTER.lat,
      lng: HARDCODED_CENTER.lng,
      radiusMiles: radius,
    })
      .then((data) => {
        if (!cancelled) setClubs(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [radius]);

  return (
    <Container edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
        <Text className="font-serif text-h1 text-fg">{copy.brand.wordmark}</Text>
        <Link href="/sign-in" className="text-body text-accent">
          {copy.nav.manageClub}
        </Link>
      </View>

      <View className="border-b border-border px-4 py-3">
        <Text className="text-body text-fg">
          {copy.home.searchingNear(HARDCODED_CENTER.label)}
        </Text>
        <Text className="mt-1 text-meta text-muted">{copy.home.geocodingNote}</Text>
      </View>

      <RadiusPicker value={radius} onChange={setRadius} />

      <View className="border-y border-border px-4 py-2">
        <Text className="text-eyebrow uppercase tracking-eyebrow text-muted">
          {clubs ? copy.home.resultsCount(clubs.length) : copy.home.findingClubs}
        </Text>
      </View>

      {error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-body text-fg">{copy.home.loadError}</Text>
          <Text className="mt-2 text-meta text-muted">{error}</Text>
        </View>
      ) : clubs === null ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : clubs.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-body text-fg">
            {copy.home.emptyNoResults(radius, HARDCODED_CENTER.label)}
          </Text>
        </View>
      ) : (
        <ClubList clubs={clubs} />
      )}
    </Container>
  );
}
