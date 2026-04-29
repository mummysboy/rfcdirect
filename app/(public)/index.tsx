import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { ClubList } from '@/components/clubs/ClubList';
import { Map } from '@/components/map';
import { Container } from '@/components/ui/Container';
import { LocationSearch } from '@/components/ui/LocationSearch';
import { RadiusPicker } from '@/components/ui/RadiusPicker';
import { RADIUS_MILES } from '@/lib/constants';
import { copy } from '@/lib/copy';
import type { GeocodeResult } from '@/lib/geo';
import {
  listAllClubs,
  listClubsWithinRadius,
  type ClubWithDistance,
} from '@/lib/queries';

type Center = { lng: number; lat: number; label: string };

const MAP_HEIGHT = 280;

export default function HomeScreen() {
  const router = useRouter();
  const [center, setCenter] = useState<Center | null>(null);
  const [radius, setRadius] = useState<number>(RADIUS_MILES.default);
  const [clubs, setClubs] = useState<ClubWithDistance[] | null>(null);
  const [allClubs, setAllClubs] = useState<ClubWithDistance[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listAllClubs()
      .then((data) => {
        if (!cancelled) setAllClubs(data);
      })
      .catch(() => {
        // Non-fatal — the no-location map just renders without pins.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!center) {
      setClubs(null);
      return;
    }
    let cancelled = false;
    setClubs(null);
    setError(null);
    listClubsWithinRadius({
      lat: center.lat,
      lng: center.lng,
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
  }, [center, radius]);

  const onLocationSelect = (r: GeocodeResult) =>
    setCenter({ lng: r.longitude, lat: r.latitude, label: r.placeName });

  return (
    <Container edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
        <Text className="font-serif text-h1 text-fg">{copy.brand.wordmark}</Text>
        <Link href="/sign-in" className="text-body text-accent">
          {copy.nav.manageClub}
        </Link>
      </View>

      <LocationSearch onSelect={onLocationSelect} />

      <RadiusPicker value={radius} onChange={setRadius} />

      <View style={{ height: MAP_HEIGHT }} className="border-y border-border">
        <Map
          center={center ? { lng: center.lng, lat: center.lat } : undefined}
          radiusMiles={radius}
          clubs={center ? (clubs ?? []) : (allClubs ?? [])}
          onPinPress={(slug) => router.push(`/club/${slug}`)}
        />
      </View>

      {center ? (
        <View className="border-b border-border px-4 py-2">
          <Text className="text-eyebrow uppercase tracking-eyebrow text-muted">
            {clubs === null
              ? copy.home.findingClubs
              : copy.home.resultsCount(clubs.length)}
          </Text>
        </View>
      ) : null}

      {!center ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-body text-fg">
            {copy.home.emptyNoLocation}
          </Text>
        </View>
      ) : error ? (
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
            {copy.home.emptyNoResults(radius, center.label)}
          </Text>
        </View>
      ) : (
        <ClubList clubs={clubs} />
      )}
    </Container>
  );
}
