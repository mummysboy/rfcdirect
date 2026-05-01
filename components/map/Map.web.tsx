import 'mapbox-gl/dist/mapbox-gl.css';

import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { COLORS } from '@/lib/constants';
import { copy } from '@/lib/copy';
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
  onLocate?: (loc: { lng: number; lat: number }) => void;
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
  onLocate,
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
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  // Tracks the intro spin so a center/radius change can pre-empt it.
  const introSpinRunningRef = useRef(false);
  // The constructor positions the camera at the spin's *start* (90° west of
  // target); skip the first center/radius sync so its fitBounds doesn't
  // pre-empt the easeTo that lands the user in place.
  const hasInitialCenterSyncRef = useRef(false);

  const onLocateRef = useRef(onLocate);
  onLocateRef.current = onLocate;

  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const mod = await import('mapbox-gl');
        if (cancelled || !containerRef.current) return;
        mapboxRef.current = mod;

        // Camera starts 20° east of the eventual target so the easeTo on
        // load drifts the surface west-to-east into the final framing.
        // Setting it in the constructor (rather than jumpTo'ing after load)
        // avoids a single-frame flash at the target before the spin begins.
        const reducedMotion =
          typeof window !== 'undefined' &&
          window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const introLngShift = reducedMotion ? 0 : 20;

        const map = new mod.Map({
          container: containerRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          projection: { name: 'globe' },
          ...(center
            ? {
                center: [center.lng + introLngShift, center.lat],
                zoom: zoomForRadius(radiusMiles),
              }
            : {
                bounds:
                  introLngShift === 0
                    ? US_BOUNDS
                    : shiftBoundsLng(US_BOUNDS, introLngShift),
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

          if (introLngShift === 0) return;
          // Intro flourish: a 20° west-to-east globe rotation gliding into
          // place. Camera lng decreases by 20° (the constructor started us
          // east); Mapbox normalizes to the shortest arc, so the surface
          // drifts west-to-east across the screen.
          introSpinRunningRef.current = true;
          const easeOpts = {
            duration: 2400,
            essential: true,
            easing: (t: number) => 1 - Math.pow(1 - t, 3),
          } as const;
          if (center) {
            map.easeTo({
              ...easeOpts,
              center: [center.lng, center.lat],
              zoom: zoomForRadius(radiusMiles),
            });
          } else {
            map.fitBounds(US_BOUNDS, {
              ...easeOpts,
              padding: US_FIT_PADDING,
            });
          }
          map.once('moveend', () => {
            introSpinRunningRef.current = false;
          });
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

    const src = map.getSource('radius') as
      | InstanceType<MapboxModule['GeoJSONSource']>
      | undefined;
    src?.setData(
      center
        ? circleFeature(center.lng, center.lat, radiusMiles)
        : EMPTY_DATA,
    );

    if (!hasInitialCenterSyncRef.current) {
      hasInitialCenterSyncRef.current = true;
      return;
    }

    introSpinRunningRef.current = false;

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

  const requestLocate = () => {
    if (locating) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocateError(copy.errors.geolocationUnavailable);
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onLocateRef.current?.({
          lng: pos.coords.longitude,
          lat: pos.coords.latitude,
        });
      },
      (err) => {
        setLocating(false);
        setLocateError(
          err.code === err.PERMISSION_DENIED
            ? copy.errors.geolocationDenied
            : copy.errors.geolocationUnavailable,
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  };

  const canLocate =
    typeof navigator !== 'undefined' && !!navigator.geolocation;

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
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 200 }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', minHeight: 200 }}
      />
      {canLocate && onLocate ? (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 6,
            zIndex: 5,
          }}
        >
          <button
            type="button"
            onClick={requestLocate}
            disabled={locating}
            aria-label={copy.home.useMyLocation}
            title={copy.home.useMyLocation}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              border: `1px solid ${COLORS.border}`,
              background: COLORS.surface,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: locating ? 'progress' : 'pointer',
              padding: 0,
              opacity: locating ? 0.7 : 1,
            }}
          >
            <LocateIcon spinning={locating} color={COLORS.fg} />
          </button>
          {locateError ? (
            <span
              role="alert"
              style={{
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                color: COLORS.fg,
                fontSize: 12,
                lineHeight: '16px',
                padding: '4px 8px',
                borderRadius: 4,
                maxWidth: 220,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
              }}
            >
              {locateError}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function LocateIcon({ spinning, color }: { spinning: boolean; color: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={
        spinning
          ? { animation: 'rfc-locate-spin 0.9s linear infinite' }
          : undefined
      }
    >
      <style>{`@keyframes rfc-locate-spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="3" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
    </svg>
  );
}

function shiftBoundsLng(
  b: [[number, number], [number, number]],
  deltaLng: number,
): [[number, number], [number, number]] {
  return [
    [b[0][0] + deltaLng, b[0][1]],
    [b[1][0] + deltaLng, b[1][1]],
  ];
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
