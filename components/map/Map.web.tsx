import 'mapbox-gl/dist/mapbox-gl.css';

import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { COLORS } from '@/lib/constants';
import type { ClubWithDistance } from '@/lib/queries';

type MapboxModule = typeof import('mapbox-gl');
type MapboxMap = InstanceType<MapboxModule['Map']>;
type MapboxMarker = InstanceType<MapboxModule['Marker']>;

export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

type Props = {
  center?: { lng: number; lat: number };
  radiusMiles: number;
  clubs: ClubWithDistance[];
  selectedSlug?: string | null;
  /** Increment to replay the selected pin's bounce animation. */
  bounceTick?: number;
  onPinSelect?: (slug: string) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
};

// Continental US bounding box (SW, NE) — used when no location is selected
// so the default view always frames the whole country regardless of viewport.
const US_BOUNDS: [[number, number], [number, number]] = [
  [-125, 24],
  [-66, 49],
];
const US_FIT_PADDING = 24;
const EMPTY_DATA = { type: 'FeatureCollection' as const, features: [] };

export function Map({
  center,
  radiusMiles,
  clubs,
  selectedSlug,
  bounceTick,
  onPinSelect,
  onBoundsChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markersRef = useRef<MapboxMarker[]>([]);
  const markerElsBySlugRef = useRef<Record<string, HTMLDivElement>>({});
  const clubsBySlugRef = useRef<Record<string, ClubWithDistance>>({});
  const mapboxRef = useRef<MapboxModule | null>(null);

  // Handlers can change between renders; map listeners read latest via ref.
  const onPinSelectRef = useRef(onPinSelect);
  onPinSelectRef.current = onPinSelect;
  const onBoundsChangeRef = useRef(onBoundsChange);
  onBoundsChangeRef.current = onBoundsChange;

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const mod = await import('mapbox-gl');
        if (cancelled || !containerRef.current) return;
        mapboxRef.current = mod;

        const map = new mod.Map({
          container: containerRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          ...(center
            ? {
                center: [center.lng, center.lat],
                zoom: zoomForRadius(radiusMiles),
              }
            : {
                bounds: US_BOUNDS,
                fitBoundsOptions: { padding: US_FIT_PADDING },
              }),
          accessToken: token,
          attributionControl: false,
        });
        map.addControl(new mod.AttributionControl({ compact: true }), 'bottom-right');

        map.on('load', () => {
          if (cancelled) return;
          map.addSource('radius', {
            type: 'geojson',
            data: center
              ? circleFeature(center.lng, center.lat, radiusMiles)
              : EMPTY_DATA,
          });
          map.addLayer({
            id: 'radius-fill',
            type: 'fill',
            source: 'radius',
            paint: { 'fill-color': COLORS.accent, 'fill-opacity': 0.08 },
          });
          map.addLayer({
            id: 'radius-line',
            type: 'line',
            source: 'radius',
            paint: {
              'line-color': COLORS.accent,
              'line-width': 1,
              'line-dasharray': [4, 3],
            },
          });
          setReady(true);
          emitBounds();
        });

        const emitBounds = () => {
          const cb = onBoundsChangeRef.current;
          if (!cb) return;
          const b = map.getBounds();
          if (!b) return;
          cb({
            north: b.getNorth(),
            south: b.getSouth(),
            east: b.getEast(),
            west: b.getWest(),
          });
        };
        map.on('moveend', emitBounds);

        mapRef.current = map;
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      }
    })();

    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // Init only — subsequent prop updates flow through the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Center / radius update.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    if (center) {
      map.flyTo({
        center: [center.lng, center.lat],
        zoom: zoomForRadius(radiusMiles),
        essential: true,
      });
    } else {
      map.fitBounds(US_BOUNDS, {
        padding: US_FIT_PADDING,
        essential: true,
      });
    }
    const src = map.getSource('radius') as
      | InstanceType<MapboxModule['GeoJSONSource']>
      | undefined;
    src?.setData(
      center
        ? circleFeature(center.lng, center.lat, radiusMiles)
        : EMPTY_DATA,
    );
  }, [center, radiusMiles, ready]);

  // Marker sync.
  useEffect(() => {
    const map = mapRef.current;
    const mod = mapboxRef.current;
    if (!ready || !map || !mod) return;

    markersRef.current.forEach((m) => m.remove());
    markerElsBySlugRef.current = {};
    clubsBySlugRef.current = {};
    markersRef.current = clubs.map((club) => {
      const el = document.createElement('div');
      el.style.cssText = `
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: ${COLORS.accent};
        border: 3px solid ${COLORS.surface};
        cursor: pointer;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
        transition: box-shadow 160ms ease;
        will-change: transform;
      `;
      el.setAttribute(
        'aria-label',
        `${club.name}, ${club.distance_miles.toFixed(1)} miles`,
      );
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onPinSelectRef.current?.(club.slug);
      });
      markerElsBySlugRef.current[club.slug] = el;
      clubsBySlugRef.current[club.slug] = club;
      return new mod.Marker(el)
        .setLngLat([club.longitude, club.latitude])
        .addTo(map);
    });
  }, [clubs, ready]);

  // Selection visual: thick accent ring on the selected pin, plain on others.
  useEffect(() => {
    if (!ready) return;
    for (const [slug, el] of Object.entries(markerElsBySlugRef.current)) {
      el.style.boxShadow =
        slug === selectedSlug
          ? `0 0 0 3px ${COLORS.accent}, 0 1px 3px rgba(0, 0, 0, 0.25)`
          : '0 1px 3px rgba(0, 0, 0, 0.25)';
      el.style.zIndex = slug === selectedSlug ? '10' : '0';
    }
  }, [selectedSlug, ready, clubs]);

  // Fly + bounce when selection comes from the list (bounceTick increments).
  useEffect(() => {
    if (!ready || !selectedSlug || !bounceTick) return;
    const map = mapRef.current;
    const club = clubsBySlugRef.current[selectedSlug];
    const el = markerElsBySlugRef.current[selectedSlug];
    if (!map || !club || !el) return;

    map.easeTo({
      center: [club.longitude, club.latitude],
      duration: 320,
      essential: true,
    });

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    el.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(1.6)' },
        { transform: 'scale(1)' },
      ],
      { duration: 320, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
    );
  }, [bounceTick, selectedSlug, ready]);

  if (!token) {
    return (
      <View className="flex-1 items-center justify-center bg-bg px-4">
        <Text className="text-center text-meta text-muted">
          Map unavailable — Mapbox token missing.
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-bg px-4">
        <Text className="text-center text-meta text-muted">
          Map error: {error}
        </Text>
      </View>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', minHeight: 200 }}
    />
  );
}

function zoomForRadius(miles: number): number {
  if (miles <= 5) return 10.5;
  if (miles <= 10) return 9.5;
  if (miles <= 25) return 8.5;
  if (miles <= 50) return 7.5;
  return 6.5;
}

function circleFeature(lng: number, lat: number, miles: number) {
  const points = 64;
  const radiusKm = miles * 1.609344;
  const earthRadiusKm = 6371.0088;
  const angularDist = radiusKm / earthRadiusKm;
  const lat1 = (lat * Math.PI) / 180;
  const lng1 = (lng * Math.PI) / 180;

  const coords: [number, number][] = [];
  for (let i = 0; i <= points; i++) {
    const bearing = (i / points) * 2 * Math.PI;
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angularDist) +
        Math.cos(lat1) * Math.sin(angularDist) * Math.cos(bearing),
    );
    const lng2 =
      lng1 +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDist) * Math.cos(lat1),
        Math.cos(angularDist) - Math.sin(lat1) * Math.sin(lat2),
      );
    coords.push([(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
  }
  return {
    type: 'Feature' as const,
    geometry: { type: 'Polygon' as const, coordinates: [coords] },
    properties: {},
  };
}
