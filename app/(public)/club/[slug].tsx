import { Image } from 'expo-image';
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Container } from '@/components/ui/Container';
import { useSession } from '@/lib/auth';
import { COLORS } from '@/lib/constants';
import { categoryLabels, copy, divisionLabels } from '@/lib/copy';
import { googleMapsUrlFor } from '@/lib/geo';
import { formatPracticeDays, formatPracticeTimes } from '@/lib/practice';
import { facebookUrl, instagramUrl, socialDisplay } from '@/lib/socials';
import { type Club, getClubBySlug } from '@/lib/queries';

type FetchState =
  | { kind: 'loading' }
  | { kind: 'ready'; club: Club }
  | { kind: 'missing' }
  | { kind: 'error'; message: string };

export default function ClubProfileScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [state, setState] = useState<FetchState>({ kind: 'loading' });

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setState({ kind: 'loading' });
    getClubBySlug(slug)
      .then((club) => {
        if (cancelled) return;
        setState(club ? { kind: 'ready', club } : { kind: 'missing' });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ kind: 'error', message: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (state.kind === 'loading') {
    return (
      <Container>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      </Container>
    );
  }

  if (state.kind === 'error') {
    return (
      <Container>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-h2 text-fg">{copy.errors.network}</Text>
          <Text className="mt-2 text-meta text-muted">{state.message}</Text>
        </View>
      </Container>
    );
  }

  if (state.kind === 'missing') {
    return (
      <Container>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="font-serif text-display text-fg">{copy.brand.wordmark}</Text>
          <Text className="mt-4 text-h2 text-fg">{copy.notFound.title}</Text>
          <Text className="mt-2 text-body text-muted">{copy.notFound.body}</Text>
          <Link href="/" className="mt-6 text-body text-accent underline">
            {copy.notFound.cta}
          </Link>
        </View>
      </Container>
    );
  }

  return <ProfileContent club={state.club} />;
}

function ProfileContent({ club }: { club: Club }) {
  const insets = useSafeAreaInsets();
  const session = useSession();
  const brand = club.brand_color ?? COLORS.defaultBrand;

  const isOwner =
    session.status === 'authenticated' && session.user.id === club.claimed_by;
  // Claim-prompt is shown to anyone (signed-in or not); the (admin) gate
  // handles the auth bounce when an unauthed visitor follows the link.
  const showClaimPrompt =
    session.status !== 'loading' && club.claimed_by === null;

  const contactHref = club.contact_email
    ? `mailto:${club.contact_email}`
    : club.contact_phone
      ? `tel:${club.contact_phone}`
      : null;

  const onContactPress = () => {
    if (contactHref) Linking.openURL(contactHref).catch(() => {});
  };

  const onSharePress = () => {
    const url = `/club/${club.slug}`;
    Share.share({
      title: club.name,
      message: `${club.name} — ${url}`,
      url,
    }).catch(() => {});
  };

  return (
    <Container edges={['top']}>
      <ScrollView className="flex-1">
        <View className="px-4 pb-6 pt-3" style={{ backgroundColor: brand }}>
          <Text
            className="font-serif text-eyebrow uppercase tracking-eyebrow"
            style={{ color: 'rgba(255, 255, 255, 0.65)' }}
          >
            {copy.brand.wordmark}
          </Text>

          {isOwner ? (
            <Link
              href={{
                pathname: '/clubs/[id]/edit',
                params: { id: club.id },
              }}
              asChild
            >
              <Pressable
                accessibilityRole="button"
                className="absolute right-3 top-3 rounded-full bg-surface px-4 py-2 active:opacity-80"
              >
                <Text className="text-meta text-fg">{copy.club.editCta}</Text>
              </Pressable>
            </Link>
          ) : null}

          <View className="mt-5 flex-row items-center gap-3">
            <ClubLogo club={club} />
            <Text
              className="flex-1 font-serif text-display font-medium text-surface"
              numberOfLines={3}
            >
              {club.name}
            </Text>
          </View>

          <View className="mt-4 flex-row flex-wrap gap-2">
            <Pill>
              {divisionLabels[club.division as keyof typeof divisionLabels] ??
                club.division}
            </Pill>
            <Pill>
              {categoryLabels[club.category as keyof typeof categoryLabels] ??
                club.category}
            </Pill>
            {club.year_founded ? (
              <Pill>{copy.club.foundedLabel(club.year_founded)}</Pill>
            ) : null}
          </View>
        </View>

        {showClaimPrompt ? (
          <View className="border-b border-border bg-surface px-4 py-3">
            <Link
              href="/claim"
              className="text-meta text-muted underline"
            >
              {copy.club.claimPrompt}
            </Link>
          </View>
        ) : null}

        <View className="px-4 py-5">
          <SectionHeader>{copy.club.sections.about}</SectionHeader>
          <Text className="mt-2 text-body text-fg">{club.description}</Text>
        </View>

        <View className="border-t border-border px-4 py-5">
          <SectionHeader>{copy.club.sections.details}</SectionHeader>
          <View className="mt-3 gap-3">
            <DetailRow
              label={copy.club.fields.location}
              value={club.practice_location_label ?? club.address_display}
              href={googleMapsUrlFor(club.address_display)}
              linkColor={brand}
            />
            {club.practice_days && club.practice_days.length > 0 ? (
              <DetailRow
                label={copy.club.fields.practiceDays}
                value={formatPracticeDays(club.practice_days)}
              />
            ) : null}
            {club.practice_times ? (
              <DetailRow
                label={copy.club.fields.practiceTimes}
                value={formatPracticeTimes(club.practice_times)}
              />
            ) : null}
            {club.year_founded ? (
              <DetailRow
                label={copy.club.fields.founded}
                value={String(club.year_founded)}
              />
            ) : null}
            <DetailRow
              label={copy.club.fields.division}
              value={
                divisionLabels[club.division as keyof typeof divisionLabels] ??
                club.division
              }
            />
            <DetailRow
              label={copy.club.fields.category}
              value={
                categoryLabels[club.category as keyof typeof categoryLabels] ??
                club.category
              }
            />
            {club.website_url ? (
              <DetailRow
                label={copy.club.fields.website}
                value={domainOf(club.website_url)}
                href={club.website_url}
                linkColor={brand}
              />
            ) : null}
            {club.contact_email ? (
              <DetailRow
                label={copy.club.fields.email}
                value={club.contact_email}
                href={`mailto:${club.contact_email}`}
                linkColor={brand}
              />
            ) : null}
            {club.contact_phone ? (
              <DetailRow
                label={copy.club.fields.phone}
                value={club.contact_phone}
                href={`tel:${club.contact_phone}`}
                linkColor={brand}
              />
            ) : null}
          </View>
        </View>

        {club.social_instagram || club.social_facebook ? (
          <View className="border-t border-border px-4 py-5">
            <SectionHeader>{copy.club.sections.social}</SectionHeader>
            <View className="mt-3 gap-3">
              {club.social_instagram ? (
                <DetailRow
                  label="Instagram"
                  value={socialDisplay(club.social_instagram)}
                  href={instagramUrl(club.social_instagram)}
                  linkColor={brand}
                />
              ) : null}
              {club.social_facebook ? (
                <DetailRow
                  label="Facebook"
                  value={socialDisplay(club.social_facebook)}
                  href={facebookUrl(club.social_facebook)}
                  linkColor={brand}
                />
              ) : null}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View
        className="flex-row gap-3 border-t border-border bg-surface px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        {contactHref ? (
          <Pressable
            onPress={onContactPress}
            accessibilityRole="button"
            className="flex-1 items-center rounded-full bg-fg px-4 py-3"
          >
            <Text className="text-body font-medium text-bg">
              {copy.club.contactCta}
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={onSharePress}
          accessibilityRole="button"
          className={
            contactHref
              ? 'items-center rounded-full border border-border bg-surface px-5 py-3'
              : 'flex-1 items-center rounded-full border border-border bg-surface px-5 py-3'
          }
        >
          <Text className="text-body text-fg">{copy.club.shareCta}</Text>
        </Pressable>
      </View>
    </Container>
  );
}

function ClubLogo({ club }: { club: Club }) {
  if (club.logo_url) {
    return (
      <Image
        source={club.logo_url}
        contentFit="cover"
        style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFFFFF' }}
        accessibilityLabel={`${club.name} logo`}
      />
    );
  }
  return (
    <View className="h-16 w-16 items-center justify-center rounded-full bg-surface">
      <Text className="font-serif text-display text-fg">
        {club.name.trim().charAt(0).toUpperCase() || '?'}
      </Text>
    </View>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <Text className="text-eyebrow uppercase tracking-eyebrow text-muted">
      {children}
    </Text>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <View
      className="rounded-full px-3 py-1"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.28)' }}
    >
      <Text className="text-meta text-surface">{children}</Text>
    </View>
  );
}

type DetailRowProps = {
  label: string;
  value: string;
  href?: string;
  linkColor?: string;
};

function DetailRow({ label, value, href, linkColor }: DetailRowProps) {
  const valueNode = href ? (
    <Pressable
      onPress={() => Linking.openURL(href).catch(() => {})}
      accessibilityRole="link"
    >
      <Text
        className="text-body"
        style={{ color: linkColor ?? COLORS.fg }}
        numberOfLines={1}
      >
        {value}
      </Text>
    </Pressable>
  ) : (
    <Text className="text-body text-fg" numberOfLines={2}>
      {value}
    </Text>
  );
  return (
    <View className="flex-row items-baseline justify-between gap-4">
      <Text className="text-eyebrow uppercase tracking-eyebrow text-muted">
        {label}
      </Text>
      <View className="flex-1 items-end">{valueNode}</View>
    </View>
  );
}

function domainOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return url;
  }
}

