import { FontAwesome } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

import { COLORS } from '@/lib/constants';
import { copy } from '@/lib/copy';
import { googleMapsUrlFor } from '@/lib/geo';
import { formatPracticeDays, formatPracticeTimes } from '@/lib/practice';
import { facebookUrl, instagramUrl } from '@/lib/socials';
import { type ClubWithDistance, getClubBySlug } from '@/lib/queries';

type Props = {
  /**
   * Pre-loaded list-row data — most fields render immediately from this so
   * the dropdown opens with content instead of a spinner. practice_days /
   * practice_times / practice_location_label aren't in the RPC return; they're
   * fetched in the background and slotted in when ready.
   */
  club: ClubWithDistance;
};

type Practice = {
  days: string[];
  times: string | null;
  locationLabel: string | null;
};

export function ClubExpanded({ club }: Props) {
  const [practice, setPractice] = useState<Practice | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPractice(null);
    getClubBySlug(club.slug)
      .then((full) => {
        if (cancelled || !full) return;
        setPractice({
          days: full.practice_days ?? [],
          times: full.practice_times ?? null,
          locationLabel: full.practice_location_label ?? null,
        });
      })
      .catch(() => {
        // Basic fields are already on screen — silently skip practice info.
      });
    return () => {
      cancelled = true;
    };
  }, [club.slug]);

  const locationDisplay = practice?.locationLabel ?? club.address_display;

  return (
    <View className="gap-3 border-b border-border bg-bg px-4 py-4">
      {club.description ? (
        <Text className="text-body text-fg">{club.description}</Text>
      ) : null}

      <View className="gap-2">
        <DetailRow
          label={copy.club.fields.location}
          value={locationDisplay}
          href={googleMapsUrlFor(club.address_display)}
        />
        {practice && practice.days.length > 0 ? (
          <DetailRow
            label={copy.club.fields.practiceDays}
            value={formatPracticeDays(practice.days)}
          />
        ) : null}
        {practice?.times ? (
          <DetailRow
            label={copy.club.fields.practiceTimes}
            value={formatPracticeTimes(practice.times)}
          />
        ) : null}
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
        {club.social_instagram || club.social_facebook ? (
          <View className="flex-row items-center justify-between gap-4">
            <Text className="text-eyebrow uppercase tracking-eyebrow text-muted">
              {copy.club.fields.socialMedia}
            </Text>
            <View className="flex-row items-center gap-4">
              {club.social_instagram ? (
                <Pressable
                  onPress={() =>
                    Linking.openURL(
                      instagramUrl(club.social_instagram!),
                    ).catch(() => {})
                  }
                  accessibilityRole="link"
                  accessibilityLabel="Instagram"
                  hitSlop={8}
                >
                  <FontAwesome
                    name="instagram"
                    size={22}
                    color={COLORS.accent}
                  />
                </Pressable>
              ) : null}
              {club.social_facebook ? (
                <Pressable
                  onPress={() =>
                    Linking.openURL(
                      facebookUrl(club.social_facebook!),
                    ).catch(() => {})
                  }
                  accessibilityRole="link"
                  accessibilityLabel="Facebook"
                  hitSlop={8}
                >
                  <FontAwesome
                    name="facebook"
                    size={22}
                    color={COLORS.accent}
                  />
                </Pressable>
              ) : null}
            </View>
          </View>
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
