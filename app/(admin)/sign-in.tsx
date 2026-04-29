import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { copy } from '@/lib/copy';

export default function SignInScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-h1 text-fg">{copy.auth.signInTitle}</Text>
        <Text className="mt-2 text-meta text-muted">Sign-in form scaffold</Text>
      </View>
    </SafeAreaView>
  );
}
