import { Link, Redirect, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '@/lib/auth';
import type { Category, DayOfWeek, Division } from '@/lib/constants';
import {
  categoryLabels,
  copy,
  dayLabels,
  divisionLabels,
} from '@/lib/copy';
import {
  approveClaim,
  approveClub,
  isAdmin,
  listPendingClaims,
  listPendingClubs,
  rejectClaim,
  rejectClub,
  type PendingClaim,
  type PendingClub,
} from '@/lib/queries';

type State =
  | { kind: 'loading' }
  | { kind: 'denied' }
  | {
      kind: 'ready';
      claims: PendingClaim[];
      clubs: PendingClub[];
    };

type WorkingKey = { kind: 'claim' | 'club'; id: string } | null;

export default function ModerateScreen() {
  const session = useSession();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState<WorkingKey>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const admin = await isAdmin();
      if (!admin) {
        setState({ kind: 'denied' });
        return;
      }
      const [claims, clubs] = await Promise.all([
        listPendingClaims(),
        listPendingClubs(),
      ]);
      setState({ kind: 'ready', claims, clubs });
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

  const isWorking = working !== null;

  async function handleClaimAction(
    claimId: string,
    action: 'approve' | 'reject',
  ) {
    setWorking({ kind: 'claim', id: claimId });
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

  async function handleClubAction(
    clubId: string,
    action: 'approve' | 'reject',
  ) {
    setWorking({ kind: 'club', id: clubId });
    setError(null);
    try {
      if (action === 'approve') {
        await approveClub(clubId);
      } else {
        await rejectClub(clubId);
      }
      await refresh();
    } catch (e) {
      setError((e as Error).message || copy.errors.network);
    } finally {
      setWorking(null);
    }
  }

  const isReady = state.kind === 'ready';
  const claims = isReady ? state.claims : [];
  const clubs = isReady ? state.clubs : [];
  const totalEmpty = isReady && claims.length === 0 && clubs.length === 0;

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

        {totalEmpty ? (
          <Text className="text-center text-body text-muted">
            {copy.admin.noPendingItems}
          </Text>
        ) : null}

        {isReady && clubs.length > 0 ? (
          <View className="mb-6">
            <Text className="mb-2 text-eyebrow uppercase tracking-eyebrow text-muted">
              {copy.admin.pendingClubsHeading}
            </Text>
            <View className="gap-3">
              {clubs.map((club) => (
                <PendingClubCard
                  key={club.club_id}
                  club={club}
                  busy={
                    working?.kind === 'club' && working.id === club.club_id
                  }
                  disabled={isWorking}
                  onApprove={() => handleClubAction(club.club_id, 'approve')}
                  onReject={() => handleClubAction(club.club_id, 'reject')}
                />
              ))}
            </View>
          </View>
        ) : null}

        {isReady && claims.length > 0 ? (
          <View>
            <Text className="mb-2 text-eyebrow uppercase tracking-eyebrow text-muted">
              {copy.admin.pendingClaimsHeading}
            </Text>
            <View className="gap-3">
              {claims.map((claim) => (
                <PendingClaimCard
                  key={claim.claim_id}
                  claim={claim}
                  busy={
                    working?.kind === 'claim' && working.id === claim.claim_id
                  }
                  disabled={isWorking}
                  onApprove={() =>
                    handleClaimAction(claim.claim_id, 'approve')
                  }
                  onReject={() => handleClaimAction(claim.claim_id, 'reject')}
                />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function PendingClaimCard({
  claim,
  busy,
  disabled,
  onApprove,
  onReject,
}: {
  claim: PendingClaim;
  busy: boolean;
  disabled: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <View className="rounded-2xl border border-border bg-surface p-4">
      <Text className="font-serif text-h2 text-fg" numberOfLines={1}>
        {claim.club_name}
      </Text>
      <Text className="mt-1 text-meta text-muted">
        {claim.claimant_email ?? '—'}
      </Text>
      {claim.claim_notes ? (
        <Text className="mt-2 text-body text-fg">{claim.claim_notes}</Text>
      ) : null}
      {claim.club_contact_email &&
      claim.club_contact_email !== claim.claimant_email ? (
        <Text className="mt-2 text-meta text-muted">
          {copy.admin.listedContactLabel(claim.club_contact_email)}
        </Text>
      ) : null}

      <ActionRow
        busy={busy}
        disabled={disabled}
        onApprove={onApprove}
        onReject={onReject}
      />
    </View>
  );
}

function PendingClubCard({
  club,
  busy,
  disabled,
  onApprove,
  onReject,
}: {
  club: PendingClub;
  busy: boolean;
  disabled: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const division = divisionLabels[club.club_division as Division] ?? club.club_division;
  const category = categoryLabels[club.club_category as Category] ?? club.club_category;
  const practiceDays = (club.club_practice_days ?? [])
    .map((d) => dayLabels[d as DayOfWeek] ?? d)
    .join(' · ');

  return (
    <View className="rounded-2xl border border-border bg-surface p-4">
      <Text className="font-serif text-h2 text-fg" numberOfLines={2}>
        {club.club_name}
      </Text>
      <Text className="mt-1 text-meta text-muted">
        {division} · {category}
        {club.club_year_founded ? ` · ${copy.club.foundedLabel(club.club_year_founded)}` : ''}
      </Text>
      <Text className="mt-2 text-body text-fg">{club.club_description}</Text>
      <Text className="mt-3 text-meta text-muted">
        {club.club_address_display}
      </Text>

      {practiceDays || club.club_practice_times ? (
        <Text className="mt-2 text-meta text-muted">
          {copy.admin.practiceLabel}: {practiceDays}
          {practiceDays && club.club_practice_times ? ' — ' : ''}
          {club.club_practice_times ?? ''}
        </Text>
      ) : null}

      {club.club_contact_email ? (
        <Text className="mt-2 text-meta text-muted" numberOfLines={1}>
          {copy.club.fields.email}: {club.club_contact_email}
        </Text>
      ) : null}
      {club.club_contact_phone ? (
        <Text className="mt-1 text-meta text-muted" numberOfLines={1}>
          {copy.club.fields.phone}: {club.club_contact_phone}
        </Text>
      ) : null}
      {club.club_website_url ? (
        <Text className="mt-1 text-meta text-muted" numberOfLines={1}>
          {copy.club.fields.website}: {club.club_website_url}
        </Text>
      ) : null}
      {club.club_social_instagram ? (
        <Text className="mt-1 text-meta text-muted" numberOfLines={1}>
          Instagram: {club.club_social_instagram}
        </Text>
      ) : null}
      {club.club_social_facebook ? (
        <Text className="mt-1 text-meta text-muted" numberOfLines={1}>
          Facebook: {club.club_social_facebook}
        </Text>
      ) : null}

      <Text className="mt-3 text-meta text-muted">
        {copy.admin.submittedByLabel(club.submitter_email ?? '—')}
      </Text>

      <ActionRow
        busy={busy}
        disabled={disabled}
        onApprove={onApprove}
        onReject={onReject}
      />
    </View>
  );
}

function ActionRow({
  busy,
  disabled,
  onApprove,
  onReject,
}: {
  busy: boolean;
  disabled: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <View className="mt-4 flex-row gap-3">
      <Pressable
        onPress={onApprove}
        disabled={disabled}
        accessibilityRole="button"
        style={{ opacity: busy ? 0.6 : 1 }}
        className="flex-1 items-center rounded-full bg-fg py-2"
      >
        <Text className="text-meta font-medium text-bg">
          {copy.admin.approveCta}
        </Text>
      </Pressable>
      <Pressable
        onPress={onReject}
        disabled={disabled}
        accessibilityRole="button"
        style={{ opacity: busy ? 0.6 : 1 }}
        className="flex-1 items-center rounded-full border border-border bg-surface py-2"
      >
        <Text className="text-meta text-fg">{copy.admin.rejectCta}</Text>
      </Pressable>
    </View>
  );
}
