import { Redirect, Stack, usePathname } from 'expo-router';
import { Text, View } from 'react-native';

import { useSession } from '@/lib/auth';
import { copy } from '@/lib/copy';

const AUTH_PATHS = new Set(['/sign-in', '/sign-up']);

export default function AdminLayout() {
  const session = useSession();
  const pathname = usePathname();
  const isAuthScreen = AUTH_PATHS.has(pathname);

  if (session.status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <Text className="font-serif text-h1 text-fg">{copy.brand.wordmark}</Text>
      </View>
    );
  }

  if (session.status === 'unauthenticated' && !isAuthScreen) {
    return (
      <Redirect
        href={`/sign-in?redirect=${encodeURIComponent(pathname)}`}
      />
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
