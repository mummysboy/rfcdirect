import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/lib/constants';
import { copy } from '@/lib/copy';
import {
  searchClubsByName,
  submitClaim,
  type ClubSearchResult,
} from '@/lib/queries';

export default function ClaimScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ClubSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      setResults([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      searchClubsByName(trimmed)
        .then((data) => {
          if (cancelled) return;
          setResults(data);
        })
        .catch((e: Error) => {
          if (cancelled) return;
          setError(e.message || copy.errors.network);
        })
        .finally(() => {
          if (cancelled) return;
          setSearching(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  async function onClaim(clubId: string) {
    setSubmitting(clubId);
    setError(null);
    try {
      await submitClaim({ clubId });
      router.replace('/dashboard');
    } catch (e) {
      setError((e as Error).message || copy.errors.network);
      setSubmitting(null);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <View className="flex-row items-center border-b border-border px-4 py-3">
        <Text className="font-serif text-h1 text-fg">
          {copy.admin.claimCta}
        </Text>
      </View>

      <View className="border-b border-border px-4 py-3">
        <TextInput
          value={query}
          onChangeText={setQuery}
          autoFocus
          autoCapitalize="words"
          autoCorrect={false}
          placeholderTextColor={COLORS.muted}
          className="rounded border border-border bg-surface px-3 py-3 text-body text-fg"
        />
      </View>

      {error ? (
        <View className="mx-4 mt-4 rounded border border-accent px-3 py-2">
          <Text className="text-meta text-accent">{error}</Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {results.length > 0 ? (
          <View className="rounded-2xl border border-border bg-surface">
            {results.map((club, idx) => (
              <Pressable
                key={club.id}
                onPress={() => onClaim(club.id)}
                disabled={submitting !== null}
                accessibilityRole="button"
                style={{ opacity: submitting === club.id ? 0.6 : 1 }}
                className={
                  idx === 0
                    ? 'px-4 py-3 active:bg-bg'
                    : 'border-t border-border px-4 py-3 active:bg-bg'
                }
              >
                <Text className="text-body text-fg" numberOfLines={1}>
                  {club.name}
                </Text>
                <Text
                  className="mt-1 text-meta text-muted"
                  numberOfLines={1}
                >
                  {club.address_display}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {!searching && query.trim().length > 0 && results.length === 0 ? (
          <Text className="text-center text-meta text-muted">
            {copy.notFound.title}
          </Text>
        ) : null}

        <View className="mt-8 items-center border-t border-border pt-6">
          <Link href="/clubs/new" asChild>
            <Pressable accessibilityRole="link" className="active:opacity-60">
              <Text className="text-body text-accent underline">
                {copy.admin.addClubTitle}
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
