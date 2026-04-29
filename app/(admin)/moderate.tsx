import { Link, Redirect, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '@/lib/auth';
import { copy } from '@/lib/copy';
import {
  approveClaim,
  isAdmin,
  listPendingClaims,
  rejectClaim,
  type PendingClaim,
} from '@/lib/queries';

type State =
  | { kind: 'loading' }
  | { kind: 'denied' }
  | { kind: 'ready'; claims: PendingClaim[] };

export default function ModerateScreen() {
  const session = useSession();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const admin = await isAdmin();
      if (!admin) {
        setState({ kind: 'denied' });
        return;
      }
      const claims = await listPendingClaims();
      setState({ kind: 'ready', claims });
    } catch (e) {
      setError((e as Error).message || copy.errors.network);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  if (session.status !== 'authenticated') return null;
  if (state.kind === 'denied') return <Redirect href="/dashboard" />;

  async function handleAction(
    claimId: string,
    action: 'approve' | 'reject',
  ) {
    setWorking(claimId);
    setError(null);
    try {
      if (action === 'approve') {
        await approveClaim(claimId);
      } else {
        await rejectClaim(claimId);
      }
      await refresh();
    } catch (e) {
      setError((e as Error).message || copy.errors.network);
    } finally {
      setWorking(null);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
        <Text className="font-serif text-h1 text-fg">
          {copy.brand.wordmark}
        </Text>
        <Link href="/dashboard" asChild>
          <Pressable accessibilityRole="link" className="active:opacity-60">
            <Text className="text-body text-accent">{copy.nav.back}</Text>
          </Pressable>
        </Link>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="mb-4 font-serif text-display text-fg">
          {copy.admin.moderateTitle}
        </Text>

        {error ? (
          <View className="mb-4 rounded border border-accent px-3 py-2">
            <Text className="text-meta text-accent">{error}</Text>
          </View>
        ) : null}

        {state.kind === 'loading' ? (
          <Text className="text-meta text-muted">
            {copy.home.findingClubs}
          </Text>
        ) : null}

        {state.kind === 'ready' && state.claims.length === 0 ? (
          <Text className="text-center text-body text-muted">
            {copy.admin.noPendingClaims}
          </Text>
        ) : null}

        {state.kind === 'ready' && state.claims.length > 0 ? (
          <View className="gap-3">
            {state.claims.map((claim) => (
              <View
                key={claim.claim_id}
                className="rounded-2xl border border-border bg-surface p-4"
              >
                <Text
                  className="font-serif text-h2 text-fg"
                  numberOfLines={1}
                >
                  {claim.club_name}
                </Text>
                <Text className="mt-1 text-meta text-muted">
                  {claim.claimant_email ?? '—'}
                </Text>
                {claim.claim_notes ? (
                  <Text className="mt-2 text-body text-fg">
                    {claim.claim_notes}
                  </Text>
                ) : null}
                {claim.club_contact_email &&
                claim.club_contact_email !== claim.claimant_email ? (
                  <Text className="mt-2 text-meta text-muted">
                    {copy.admin.listedContactLabel(claim.club_contact_email)}
                  </Text>
                ) : null}

                <View className="mt-4 flex-row gap-3">
                  <Pressable
                    onPress={() => handleAction(claim.claim_id, 'approve')}
                    disabled={working !== null}
                    accessibilityRole="button"
                    style={{
                      opacity: working === claim.claim_id ? 0.6 : 1,
                    }}
                    className="flex-1 items-center rounded-full bg-fg py-2"
                  >
                    <Text className="text-meta font-medium text-bg">
                      {copy.admin.approveCta}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleAction(claim.claim_id, 'reject')}
                    disabled={working !== null}
                    accessibilityRole="button"
                    style={{
                      opacity: working === claim.claim_id ? 0.6 : 1,
                    }}
                    className="flex-1 items-center rounded-full border border-border bg-surface py-2"
                  >
                    <Text className="text-meta text-fg">
                      {copy.admin.rejectCta}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
