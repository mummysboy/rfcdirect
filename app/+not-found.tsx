import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { copy } from '@/lib/copy';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: copy.notFound.title }} />
      <SafeAreaView className="flex-1 bg-bg">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="font-serif text-display text-fg">{copy.brand.wordmark}</Text>
          <Text className="mt-4 text-h2 text-fg">{copy.notFound.title}</Text>
          <Text className="mt-2 text-body text-muted">{copy.notFound.body}</Text>
          <Link href="/" className="mt-6 text-body text-accent underline">
            {copy.notFound.cta}
          </Link>
        </View>
      </SafeAreaView>
    </>
  );
}
