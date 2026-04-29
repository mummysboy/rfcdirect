import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditClubScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-h1 text-fg">Edit club</Text>
        <Text className="mt-2 text-meta text-muted">id: {id}</Text>
      </View>
    </SafeAreaView>
  );
}
