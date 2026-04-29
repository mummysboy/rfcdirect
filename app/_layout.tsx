import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import '../global.css';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(public)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
