import { Link } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { copy } from '@/lib/copy';

const TOP_BAR_HEIGHT = 50;

export function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const close = () => setOpen(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={copy.nav.menu}
        accessibilityState={{ expanded: open }}
        hitSlop={8}
        className="-mr-2 p-2 active:opacity-60"
      >
        <View style={{ gap: 4 }}>
          <View className="h-[2px] w-5 bg-accent" />
          <View className="h-[2px] w-5 bg-accent" />
          <View className="h-[2px] w-5 bg-accent" />
        </View>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.nav.menu}
          onPress={close}
          style={{
            flex: 1,
            paddingTop: insets.top + TOP_BAR_HEIGHT,
            paddingHorizontal: 8,
            alignItems: 'flex-end',
          }}
        >
          <View
            onStartShouldSetResponder={() => true}
            className="min-w-[180px] overflow-hidden rounded-md border border-border bg-surface"
          >
            <Link href="/" asChild>
              <Pressable
                onPress={close}
                accessibilityRole="link"
                className="px-4 py-3 active:bg-bg"
              >
                <Text className="text-body text-fg">{copy.nav.home}</Text>
              </Pressable>
            </Link>
            <Link href="/sign-in" asChild>
              <Pressable
                onPress={close}
                accessibilityRole="link"
                className="border-t border-border px-4 py-3 active:bg-bg"
              >
                <Text className="text-body text-fg">{copy.nav.signIn}</Text>
              </Pressable>
            </Link>
            <Link href="/contact" asChild>
              <Pressable
                onPress={close}
                accessibilityRole="link"
                className="border-t border-border px-4 py-3 active:bg-bg"
              >
                <Text className="text-body text-fg">{copy.nav.contact}</Text>
              </Pressable>
            </Link>
            <Link href="/about" asChild>
              <Pressable
                onPress={close}
                accessibilityRole="link"
                className="border-t border-border px-4 py-3 active:bg-bg"
              >
                <Text className="text-body text-fg">{copy.nav.about}</Text>
              </Pressable>
            </Link>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
