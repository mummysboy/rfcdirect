import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { COLORS } from '@/lib/constants';
import { copy } from '@/lib/copy';
import { debounce, geocode, type GeocodeResult } from '@/lib/geo';

type Props = {
  onSelect: (result: GeocodeResult) => void;
};

export function LocationSearch({ onSelect }: Props) {
  const [text, setText] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runGeocode = useMemo(
    () =>
      debounce((q: string) => {
        if (q.trim().length < 2) {
          setResults([]);
          setOpen(false);
          return;
        }
        geocode(q)
          .then((r) => {
            setResults(r);
            setOpen(r.length > 0);
            setError(null);
          })
          .catch(() => {
            setResults([]);
            setOpen(false);
            setError(copy.errors.geocoding);
          });
      }, 300),
    [],
  );

  return (
    <View
      style={{ position: 'relative', zIndex: 50 }}
      className="border-b border-border"
    >
      <TextInput
        value={text}
        onChangeText={(t) => {
          setText(t);
          setError(null);
          runGeocode(t);
        }}
        placeholder={copy.home.locationPlaceholder}
        placeholderTextColor={COLORS.muted}
        accessibilityLabel={copy.home.locationPlaceholder}
        className="bg-surface px-4 py-3 text-body text-fg"
      />
      {error ? (
        <Text className="bg-surface px-4 pb-2 text-meta text-accent">
          {error}
        </Text>
      ) : null}
      {open && results.length > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 60,
          }}
          className="border-b border-border bg-surface"
        >
          {results.map((r) => (
            <Pressable
              key={`${r.longitude},${r.latitude},${r.placeName}`}
              onPress={() => {
                setText(r.placeName);
                setOpen(false);
                setResults([]);
                onSelect(r);
              }}
              accessibilityRole="button"
              className="border-t border-border px-4 py-3 active:bg-bg"
            >
              <Text className="text-body text-fg" numberOfLines={1}>
                {r.placeName}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
