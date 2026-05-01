import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ClubForm } from '@/components/clubs/ClubForm';
import { useSession } from '@/lib/auth';
import { STATUS } from '@/lib/constants';
import { createClub } from '@/lib/queries';
import { slugify } from '@/lib/slugify';
import type { ClubFormInput } from '@/lib/validation';

export default function NewClubScreen() {
  const session = useSession();

  async function handleSubmit(
    values: ClubFormInput,
    _logoUrl: string | null,
  ) {
    if (session.status !== 'authenticated') {
      throw new Error('Not signed in');
    }
    if (values.latitude == null || values.longitude == null) {
      throw new Error('Pick an address from the dropdown to set the location');
    }
    await createClub({
      baseSlug: slugify(values.name),
      insert: {
        name: values.name,
        description: values.description,
        year_founded: values.year_founded ?? null,
        division: values.division,
        category: values.category,
        address_display: values.address_display,
        location: `POINT(${values.longitude} ${values.latitude})`,
        website_url: values.website_url ?? null,
        social_instagram: values.social_instagram ?? null,
        social_facebook: values.social_facebook ?? null,
        contact_email: values.contact_email ?? null,
        contact_phone: values.contact_phone ?? null,
        brand_color: values.brand_color ?? null,
        practice_days: values.practice_days,
        practice_times: values.practice_times ?? null,
        practice_location_label: values.practice_location_label ?? null,
        logo_url: null,
        claimed_by: session.user.id,
        status: STATUS.pending,
      },
    });
    router.replace('/dashboard');
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ClubForm mode="new" onSubmit={handleSubmit} />
    </SafeAreaView>
  );
}
