import 'mapbox-gl/dist/mapbox-gl.css';

import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { COLORS } from '@/lib/constants';
import type { ClubWithDistance } from '@/lib/queries';

type MapboxModule = typeof import('mapbox-gl');
type MapboxMap = InstanceType<MapboxModule['Map']>;
type MapboxMarker = InstanceType<MapboxModule['Marker']>;

type Props = {
  center?: { lng: number; lat: number };
  radiusMiles: number;
  clubs: ClubWithDistance[];
  onPinPress?: (slug: string) => void;
};

// Continental US default until the user selects a location.
const DEFAULT_CENTER: [number, number] = [-98, 39];
const DEFAULT_ZOOM = 3.5;
const EMPTY_DATA = { type: 'FeatureCollection' as const, features: [] };

export function Map({ center, radiusMiles, clubs, onPinPress }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markersRef = useRef<MapboxMarker[]>([]);
  const mapboxRef = useRef<MapboxModule | null>(null);

  // Pin handler can change between renders; markers read latest via ref.
  const onPinPressRef = useRef(onPinPress);
  onPinPressRef.current = onPinPress;

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
          center: center ? [center.lng, center.lat] : DEFAULT_CENTER,
          zoom: center ? zoomForRadius(radiusMiles) : DEFAULT_ZOOM,
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
        });

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
    map.flyTo({
      center: center ? [center.lng, center.lat] : DEFAULT_CENTER,
      zoom: center ? zoomForRadius(radiusMiles) : DEFAULT_ZOOM,
      essential: true,
    });
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
      `;
      el.setAttribute(
        'aria-label',
        `${club.name}, ${club.distance_miles.toFixed(1)} miles`,
      );
      el.addEventListener('click', () => onPinPressRef.current?.(club.slug));
      return new mod.Marker(el)
        .setLngLat([club.longitude, club.latitude])
        .addTo(map);
    });
  }, [clubs, ready]);

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
