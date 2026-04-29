import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native';

import { categoryLabels, copy, divisionLabels } from '@/lib/copy';
import { type Club, getClubBySlug } from '@/lib/queries';

type Props = { slug: string };

type FetchState =
  | { kind: 'loading' }
  | { kind: 'ready'; club: Club }
  | { kind: 'missing' }
  | { kind: 'error' };

export function ClubExpanded({ slug }: Props) {
  const [state, setState] = useState<FetchState>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    getClubBySlug(slug)
      .then((club) => {
        if (cancelled) return;
        setState(club ? { kind: 'ready', club } : { kind: 'missing' });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (state.kind === 'loading') {
    return (
      <View className="border-b border-border bg-bg px-4 py-4">
        <ActivityIndicator />
      </View>
    );
  }

  if (state.kind === 'error' || state.kind === 'missing') {
    return (
      <View className="border-b border-border bg-bg px-4 py-4">
        <Text className="text-meta text-muted">{copy.errors.network}</Text>
      </View>
    );
  }

  const { club } = state;
  return (
    <View className="gap-3 border-b border-border bg-bg px-4 py-4">
      {club.description ? (
        <Text className="text-body text-fg">{club.description}</Text>
      ) : null}

      <View className="gap-2">
        <DetailRow label={copy.club.fields.location} value={club.address_display} />
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
          />
        ) : null}
        {club.contact_email ? (
          <DetailRow
            label={copy.club.fields.email}
            value={club.contact_email}
            href={`mailto:${club.contact_email}`}
          />
        ) : null}
        {club.contact_phone ? (
          <DetailRow
            label={copy.club.fields.phone}
            value={club.contact_phone}
            href={`tel:${club.contact_phone}`}
          />
        ) : null}
      </View>
    </View>
  );
}

type DetailRowProps = {
  label: string;
  value: string;
  href?: string;
};

function DetailRow({ label, value, href }: DetailRowProps) {
  const valueNode = href ? (
    <Pressable
      onPress={() => Linking.openURL(href).catch(() => {})}
      accessibilityRole="link"
    >
      <Text className="text-body text-accent" numberOfLines={1}>
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
