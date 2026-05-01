import { Link } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Container } from '@/components/ui/Container';
import { copy } from '@/lib/copy';

export default function ContactScreen() {
  return (
    <Container edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
        <Text className="font-serif text-h1 text-fg">
          {copy.brand.wordmark}
        </Text>
        <Link href="/" asChild>
          <Pressable accessibilityRole="link" className="active:opacity-60">
            <Text className="text-body text-accent">{copy.nav.back}</Text>
          </Pressable>
        </Link>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="mb-4 font-serif text-display text-fg">
          {copy.contact.title}
        </Text>
        <Text className="text-body text-fg">{copy.contact.body}</Text>
      </ScrollView>
    </Container>
  );
}
