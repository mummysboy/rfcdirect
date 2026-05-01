import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import {
  ActivityIndicator,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { ClubList, type ClubListHandle } from '@/components/clubs/ClubList';
import { Map, type MapBounds } from '@/components/map';
import { CategoryFilters } from '@/components/ui/CategoryFilters';
import { CompactFiltersBar } from '@/components/ui/CompactFiltersBar';
import { Container } from '@/components/ui/Container';
import { HamburgerMenu } from '@/components/ui/HamburgerMenu';
import { LocationSearch } from '@/components/ui/LocationSearch';
import {
  CATEGORY_FILTER_MAP,
  RADIUS_MILES,
  type Category,
  type CategoryFilter,
  type PlaceholderFilter,
} from '@/lib/constants';
import {
  categoryFilterLabels,
  copy,
  placeholderFilterLabels,
} from '@/lib/copy';
import type { GeocodeResult } from '@/lib/geo';
import { listAllClubs, type ClubWithDistance } from '@/lib/queries';

type Center = { lng: number; lat: number; label: string };

const MAP_HEIGHT = 280;
const MOBILE_BREAKPOINT = 768;
const SCROLL_THRESHOLD = 24;

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width > 0 && width < MOBILE_BREAKPOINT;

  const [center, setCenter] = useState<Center | null>(null);
  const [allClubs, setAllClubs] = useState<ClubWithDistance[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [bounceTick, setBounceTick] = useState(0);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<
    ReadonlySet<CategoryFilter>
  >(() => new Set());
  const [placeholderMode, setPlaceholderMode] =
    useState<PlaceholderFilter | null>(null);

  const [chromeHeight, setChromeHeight] = useState(0);
  const [showCompactBar, setShowCompactBar] = useState(false);
  // Tracked outside React state because every scroll tick mutates it; only
  // crossing the show/hide threshold should re-render.
  const scrollState = useRef({
    lastY: 0,
    direction: null as 'up' | 'down' | null,
    delta: 0,
  });
  const listHandleRef = useRef<ClubListHandle>(null);

  // Refetch on center change so `distance_miles` is measured from the searched
  // location. The map's framing radius is fixed (RADIUS_MILES.default) and
  // does not filter which pins are loaded — users can zoom out to see the
  // rest of the country. Category filters are applied client-side below.
  useEffect(() => {
    let cancelled = false;
    setError(null);
    setSelectedSlug(null);
    listAllClubs(center ? { lat: center.lat, lng: center.lng } : undefined)
      .then((data) => {
        if (!cancelled) setAllClubs(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [center]);

  // Crossing into desktop width while the bar is up would leave it stranded.
  useEffect(() => {
    if (!isMobile) setShowCompactBar(false);
  }, [isMobile]);

  const onLocationSelect = (r: GeocodeResult) =>
    setCenter({ lng: r.longitude, lat: r.latitude, label: r.placeName });

  const onLocate = useCallback(
    (loc: { lng: number; lat: number }) =>
      setCenter({
        lng: loc.lng,
        lat: loc.lat,
        label: copy.home.currentLocationLabel,
      }),
    [],
  );

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
  const clubsInView = useMemo(() => {
    if (!allClubs) return null;
    if (!bounds) return allClubs;
    return allClubs.filter(
      (c) =>
        c.latitude <= bounds.north &&
        c.latitude >= bounds.south &&
        c.longitude <= bounds.east &&
        c.longitude >= bounds.west,
    );
  }, [allClubs, bounds]);

  // Empty filter set = no narrowing; otherwise union the categories each
  // chip represents (Youth chip covers all three youth_* categories).
  const filteredClubs = useMemo(() => {
    if (!clubsInView) return null;
    if (selectedFilters.size === 0) return clubsInView;
    const allowed = new Set<Category>();
    selectedFilters.forEach((f) => {
      CATEGORY_FILTER_MAP[f].forEach((c) => allowed.add(c));
    });
    return clubsInView.filter((c) => allowed.has(c.category as Category));
  }, [clubsInView, selectedFilters]);

  // Default ordering: oldest first. Clubs without a founding year sink to
  // the bottom so the heritage angle doesn't get diluted by undated rows.
  const sortedClubs = useMemo(() => {
    if (!filteredClubs) return null;
    return [...filteredClubs].sort((a, b) => {
      const ay = a.year_founded ?? Infinity;
      const by = b.year_founded ?? Infinity;
      return ay - by;
    });
  }, [filteredClubs]);

  const onToggleFilter = useCallback((filter: CategoryFilter) => {
    setSelectedFilters((cur) => {
      const next = new Set(cur);
      if (next.has(filter)) next.delete(filter);
      else next.add(filter);
      return next;
    });
  }, []);

  // Radio-like: clicking the active mode clears it, clicking a different
  // one switches. Two modes can't coexist — the placeholder body would be
  // ambiguous.
  const onPlaceholderToggle = useCallback((filter: PlaceholderFilter) => {
    setPlaceholderMode((cur) => (cur === filter ? null : filter));
  }, []);

  const filtersSummary = useMemo(() => {
    if (selectedFilters.size === 0) return copy.home.filtersChipAll;
    return [...selectedFilters]
      .map((f) => categoryFilterLabels[f])
      .join(' · ');
  }, [selectedFilters]);

  const onChromeLayout = useCallback((e: LayoutChangeEvent) => {
    setChromeHeight(e.nativeEvent.layout.height);
  }, []);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!isMobile || chromeHeight === 0) return;
      const y = e.nativeEvent.contentOffset.y;
      const dy = y - scrollState.current.lastY;
      if (Math.abs(dy) < 1) return;

      const direction: 'up' | 'down' = dy > 0 ? 'down' : 'up';
      if (direction !== scrollState.current.direction) {
        scrollState.current.delta = 0;
        scrollState.current.direction = direction;
      }
      scrollState.current.delta += Math.abs(dy);
      scrollState.current.lastY = y;

      // Chrome is still on screen — keep the bar hidden, the chrome itself
      // already shows everything the bar would.
      if (y < chromeHeight) {
        if (showCompactBar) setShowCompactBar(false);
        return;
      }

      if (
        direction === 'up' &&
        !showCompactBar &&
        scrollState.current.delta >= SCROLL_THRESHOLD
      ) {
        setShowCompactBar(true);
      } else if (
        direction === 'down' &&
        showCompactBar &&
        scrollState.current.delta >= SCROLL_THRESHOLD
      ) {
        setShowCompactBar(false);
      }
    },
    [isMobile, chromeHeight, showCompactBar],
  );

  const onCompactBarPress = useCallback(() => {
    listHandleRef.current?.scrollToTop();
    setShowCompactBar(false);
  }, []);

  const chrome = (
    <>
      <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
        <Text className="font-serif text-h1 text-fg">{copy.brand.wordmark}</Text>
        <HamburgerMenu />
      </View>

      <LocationSearch onSelect={onLocationSelect} />

      <CategoryFilters
        selected={selectedFilters}
        onToggle={onToggleFilter}
        placeholderMode={placeholderMode}
        onPlaceholderToggle={onPlaceholderToggle}
      />

      <View style={{ height: MAP_HEIGHT }} className="border-y border-border">
        <Map
          center={center ? { lng: center.lng, lat: center.lat } : undefined}
          radiusMiles={RADIUS_MILES.default}
          clubs={filteredClubs ?? []}
          selectedSlug={selectedSlug}
          bounceTick={bounceTick}
          onPinSelect={onSelectFromMap}
          onBoundsChange={setBounds}
          onLocate={onLocate}
        />
      </View>

      {placeholderMode === null &&
      allClubs !== null &&
      filteredClubs !== null ? (
        <View className="border-b border-border px-4 py-2">
          <Text className="text-eyebrow uppercase tracking-eyebrow text-muted">
            {copy.home.resultsInView(filteredClubs.length)}
          </Text>
        </View>
      ) : null}
    </>
  );

  let belowChrome: ReactElement | null = null;
  if (placeholderMode !== null) {
    belowChrome = (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="font-serif text-h1 text-fg">
          {placeholderFilterLabels[placeholderMode]}
        </Text>
        <Text className="mt-2 text-body text-muted">
          {copy.home.filtersComingSoon}
        </Text>
      </View>
    );
  } else if (center && error) {
    belowChrome = (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-body text-fg">{copy.home.loadError}</Text>
        <Text className="mt-2 text-meta text-muted">{error}</Text>
      </View>
    );
  } else if (allClubs === null) {
    belowChrome = (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  } else if (filteredClubs && filteredClubs.length === 0) {
    // If the geographic view has clubs but filters drop them all, name the
    // filter as the cause so "Pan or zoom out" doesn't mislead.
    const filterIsCause =
      selectedFilters.size > 0 &&
      clubsInView !== null &&
      clubsInView.length > 0;
    belowChrome = (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-center text-body text-fg">
          {filterIsCause
            ? copy.home.emptyNoClubsForFilters
            : copy.home.emptyNoClubsInView}
        </Text>
      </View>
    );
  }

  if (isMobile) {
    return (
      <Container edges={['top']}>
        {showCompactBar && center ? (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 70,
            }}
          >
            <CompactFiltersBar
              location={center.label}
              filters={filtersSummary}
              count={filteredClubs?.length ?? null}
              onPress={onCompactBarPress}
            />
          </View>
        ) : null}
        <ClubList
          ref={listHandleRef}
          clubs={belowChrome ? [] : sortedClubs ?? []}
          selectedSlug={selectedSlug}
          onSelect={onSelectFromList}
          hideDistance={!center}
          header={<View onLayout={onChromeLayout}>{chrome}</View>}
          empty={belowChrome}
          onScroll={onScroll}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      </Container>
    );
  }

  return (
    <Container edges={['top']}>
      {chrome}
      {belowChrome ?? (
        <ClubList
          clubs={sortedClubs ?? []}
          selectedSlug={selectedSlug}
          onSelect={onSelectFromList}
          hideDistance={!center}
        />
      )}
    </Container>
  );
}
