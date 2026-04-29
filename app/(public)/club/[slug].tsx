import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ClubProfileScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-h1 text-fg">Club: {slug}</Text>
        <Text className="mt-2 text-meta text-muted">Profile screen scaffold</Text>
      </View>
    </SafeAreaView>
  );
}
