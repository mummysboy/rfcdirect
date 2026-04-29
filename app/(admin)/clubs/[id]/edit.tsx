import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ClubForm } from '@/components/clubs/ClubForm';
import type { Category, DayOfWeek, Division } from '@/lib/constants';
import { getClubById, updateClub, type Club } from '@/lib/queries';
import type { ClubFormInput } from '@/lib/validation';
import type { Database } from '@/types/database';

type State =
  | { kind: 'loading' }
  | { kind: 'loaded'; club: Club }
  | { kind: 'missing' };

export default function EditClubScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    if (!id) {
      setState({ kind: 'missing' });
      return;
    }
    let cancelled = false;
    getClubById(id)
      .then((club) => {
        if (cancelled) return;
        setState(club ? { kind: 'loaded', club } : { kind: 'missing' });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: 'missing' });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state.kind === 'loading') {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  if (state.kind === 'missing') {
    return <Redirect href="/dashboard" />;
  }

  const { club } = state;
  const defaults: ClubFormInput = {
    name: club.name,
    description: club.description,
    year_founded: club.year_founded,
    division: club.division as Division,
    category: club.category as Category,
    address_display: club.address_display,
    // lat/lng are not prefilled — `getClubById` doesn't expose them. The form's
    // mapper only includes `location` in the patch when the user re-picks an
    // address, so unchanged-address edits leave the existing point alone.
    latitude: null,
    longitude: null,
    website_url: club.website_url,
    social_instagram: club.social_instagram,
    social_facebook: club.social_facebook,
    contact_email: club.contact_email,
    contact_phone: club.contact_phone,
    brand_color: club.brand_color,
    practice_days: (club.practice_days ?? []) as DayOfWeek[],
    practice_times: club.practice_times,
  };

  async function handleSubmit(
    values: ClubFormInput,
    logoUrl: string | null,
  ) {
    const patch: Database['public']['Tables']['clubs']['Update'] = {
      name: values.name,
      description: values.description,
      year_founded: values.year_founded ?? null,
      division: values.division,
      category: values.category,
      website_url: values.website_url ?? null,
      social_instagram: values.social_instagram ?? null,
      social_facebook: values.social_facebook ?? null,
      contact_email: values.contact_email ?? null,
      contact_phone: values.contact_phone ?? null,
      brand_color: values.brand_color ?? null,
      practice_days: values.practice_days,
      practice_times: values.practice_times ?? null,
      logo_url: logoUrl,
    };
    if (values.latitude != null && values.longitude != null) {
      patch.address_display = values.address_display;
      patch.location = `POINT(${values.longitude} ${values.latitude})`;
    }
    await updateClub(club.id, patch);
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ClubForm
        mode="edit"
        clubId={club.id}
        currentLogoUrl={club.logo_url}
        defaultValues={defaults}
        onSubmit={handleSubmit}
      />
    </SafeAreaView>
  );
}
