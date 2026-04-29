import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { copy } from '@/lib/copy';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <View className="flex-1 items-center justify-center px-6">
        <Text className="font-serif text-display text-fg">{copy.brand.wordmark}</Text>
        <Text className="mt-2 text-body text-muted">{copy.home.tagline}</Text>
        <Link
          href="/(admin)/sign-in"
          className="mt-8 text-body text-accent underline"
        >
          {copy.nav.manageClub}
        </Link>
      </View>
    </SafeAreaView>
  );
}
