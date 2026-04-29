import { Link } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { ClubList } from '@/components/clubs/ClubList';
import { Map, type MapBounds } from '@/components/map';
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
  const [center, setCenter] = useState<Center | null>(null);
  const [radius, setRadius] = useState<number>(RADIUS_MILES.default);
  const [clubs, setClubs] = useState<ClubWithDistance[] | null>(null);
  const [allClubs, setAllClubs] = useState<ClubWithDistance[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [bounceTick, setBounceTick] = useState(0);
  const [bounds, setBounds] = useState<MapBounds | null>(null);

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
      setSelectedSlug(null);
      return;
    }
    let cancelled = false;
    setClubs(null);
    setSelectedSlug(null);
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

  // Tap toggles inline expansion. List taps also bounce the corresponding
  // map pin so the user gets a kinetic confirmation of which one they hit.
  const onSelectFromMap = useCallback((slug: string) => {
    setSelectedSlug((cur) => (cur === slug ? null : slug));
  }, []);

  const onSelectFromList = useCallback(
    (slug: string) => {
      if (slug === selectedSlug) {
        setSelectedSlug(null);
        return;
      }
      setSelectedSlug(slug);
      setBounceTick((n) => n + 1);
    },
    [selectedSlug],
  );

  // The list shows whichever pins are currently visible in the map's viewport
  // — pan/zoom the map and the list re-filters on `moveend`.
  const sourceClubs = center ? clubs : allClubs;
  const clubsInView = useMemo(() => {
    if (!sourceClubs) return null;
    if (!bounds) return sourceClubs;
    return sourceClubs.filter(
      (c) =>
        c.latitude <= bounds.north &&
        c.latitude >= bounds.south &&
        c.longitude <= bounds.east &&
        c.longitude >= bounds.west,
    );
  }, [sourceClubs, bounds]);

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
          clubs={sourceClubs ?? []}
          selectedSlug={selectedSlug}
          bounceTick={bounceTick}
          onPinSelect={onSelectFromMap}
          onBoundsChange={setBounds}
        />
      </View>

      {sourceClubs !== null && clubsInView !== null ? (
        <View className="border-b border-border px-4 py-2">
          <Text className="text-eyebrow uppercase tracking-eyebrow text-muted">
            {copy.home.resultsInView(clubsInView.length)}
          </Text>
        </View>
      ) : null}

      {center && error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-body text-fg">{copy.home.loadError}</Text>
          <Text className="mt-2 text-meta text-muted">{error}</Text>
        </View>
      ) : sourceClubs === null ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : center && clubs !== null && clubs.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-body text-fg">
            {copy.home.emptyNoResults(radius, center.label)}
          </Text>
        </View>
      ) : clubsInView && clubsInView.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-body text-fg">
            {copy.home.emptyNoClubsInView}
          </Text>
        </View>
      ) : (
        <ClubList
          clubs={clubsInView ?? []}
          selectedSlug={selectedSlug}
          onSelect={onSelectFromList}
          hideDistance={!center}
        />
      )}
    </Container>
  );
}
