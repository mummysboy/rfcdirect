import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { signOut, useSession } from '@/lib/auth';
import { STATUS } from '@/lib/constants';
import { copy } from '@/lib/copy';
import {
  isAdmin,
  listClaimsForUser,
  listClubsForOwner,
  type ClaimWithClub,
  type Club,
} from '@/lib/queries';

type DashboardData = {
  ownedClubs: Club[];
  pendingClaims: ClaimWithClub[];
  isAdminUser: boolean;
};

// String-keyed (not `Record<Status, string>`) so we can look up by `club.status`
// without casting; the keys still come from the typed `STATUS` constants.
const STATUS_LABEL: Record<string, string> = {
  [STATUS.pending]: copy.admin.statusPending,
  [STATUS.approved]: copy.admin.statusApproved,
  [STATUS.rejected]: copy.admin.statusRejected,
};

export default function DashboardScreen() {
  const session = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userId =
    session.status === 'authenticated' ? session.user.id : null;

  const refresh = useCallback(async () => {
    if (!userId) return;
    setError(null);
    try {
      const [claims, ownedClubs, isAdminUser] = await Promise.all([
        listClaimsForUser(userId),
        listClubsForOwner(userId),
        isAdmin(),
      ]);
      const ownedIds = new Set(ownedClubs.map((c) => c.id));
      const pendingClaims = claims.filter(
        (c) => !ownedIds.has(c.club.id) && c.status === STATUS.pending,
      );
      setData({ ownedClubs, pendingClaims, isAdminUser });
    } catch (e) {
      setError((e as Error).message || copy.errors.network);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  if (session.status !== 'authenticated') {
    // Gate handles redirect; this is just narrowing for TS.
    return null;
  }

  const isEmpty =
    data !== null &&
    data.ownedClubs.length === 0 &&
    data.pendingClaims.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
        <Text className="font-serif text-h1 text-fg">
          {copy.brand.wordmark}
        </Text>
        <View className="flex-row items-center gap-4">
          {data?.isAdminUser ? (
            <Link href="/moderate" asChild>
              <Pressable
                accessibilityRole="link"
                className="active:opacity-60"
              >
                <Text className="text-body text-accent">
                  {copy.admin.moderateCta}
                </Text>
              </Pressable>
            </Link>
          ) : null}
          <Pressable
            onPress={() => {
              void signOut();
            }}
            accessibilityRole="button"
            className="active:opacity-60"
          >
            <Text className="text-body text-accent">{copy.nav.signOut}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="mb-4 font-serif text-display text-fg">
          {copy.admin.dashboardTitle}
        </Text>

        {error ? (
          <View className="mb-4 rounded border border-accent px-3 py-2">
            <Text className="text-meta text-accent">{error}</Text>
          </View>
        ) : null}

        {data === null && error === null ? (
          <Text className="text-meta text-muted">
            {copy.home.findingClubs}
          </Text>
        ) : null}

        {isEmpty ? (
          <View className="items-center py-8">
            <Text className="mb-4 text-center text-body text-muted">
              {copy.admin.emptyDashboard}
            </Text>
            <Link href="/claim" asChild>
              <Pressable
                accessibilityRole="button"
                className="items-center rounded-full bg-fg px-6 py-3"
              >
                <Text className="text-body font-medium text-bg">
                  {copy.admin.claimCta}
                </Text>
              </Pressable>
            </Link>
          </View>
        ) : null}

        {data !== null && !isEmpty ? (
          <>
            <View className="rounded-2xl border border-border bg-surface">
              {data.ownedClubs.map((club, idx) => (
                <Link
                  key={club.id}
                  href={{
                    pathname: '/clubs/[id]/edit',
                    params: { id: club.id },
                  }}
                  asChild
                >
                  <Pressable
                    accessibilityRole="button"
                    className={
                      idx === 0
                        ? 'flex-row items-center justify-between px-4 py-3 active:bg-bg'
                        : 'flex-row items-center justify-between border-t border-border px-4 py-3 active:bg-bg'
                    }
                  >
                    <Text
                      className="flex-1 pr-3 text-body text-fg"
                      numberOfLines={1}
                    >
                      {club.name}
                    </Text>
                    <Text className="text-eyebrow uppercase tracking-eyebrow text-muted">
                      {STATUS_LABEL[club.status] ?? club.status}
                    </Text>
                  </Pressable>
                </Link>
              ))}
              {data.pendingClaims.map((claim, idx) => {
                const isFirst = idx === 0 && data.ownedClubs.length === 0;
                return (
                  <View
                    key={claim.id}
                    className={
                      isFirst
                        ? 'flex-row items-center justify-between px-4 py-3'
                        : 'flex-row items-center justify-between border-t border-border px-4 py-3'
                    }
                  >
                    <Text
                      className="flex-1 pr-3 text-body text-fg"
                      numberOfLines={1}
                    >
                      {claim.club.name}
                    </Text>
                    <Text className="text-eyebrow uppercase tracking-eyebrow text-muted">
                      {copy.admin.statusPending}
                    </Text>
                  </View>
                );
              })}
            </View>

            <Link href="/claim" asChild>
              <Pressable
                accessibilityRole="button"
                className="mt-6 items-center rounded-full bg-fg py-3"
              >
                <Text className="text-body font-medium text-bg">
                  {copy.admin.claimCta}
                </Text>
              </Pressable>
            </Link>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
