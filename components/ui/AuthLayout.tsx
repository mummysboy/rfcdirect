import { Link } from 'expo-router';
import { type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { Container } from './Container';
import { HamburgerMenu } from './HamburgerMenu';
import { copy } from '@/lib/copy';

const DESKTOP_BREAKPOINT = 1024;

type Props = {
  children: ReactNode;
};

/**
 * Two-panel layout for /sign-in and /sign-up. On wide viewports the brand
 * panel sits left and the form right; on narrow viewports the brand collapses
 * to a compact hero block above the form. Width-driven (not breakpoint
 * classes) so the same code path works on web and native.
 */
export function AuthLayout({ children }: Props) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;

  return (
    <Container>
      <View className="flex-row items-center justify-between px-4 py-3">
        <Link href="/" asChild>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={copy.nav.back}
            hitSlop={8}
            className="-ml-2 p-2 active:opacity-60"
          >
            <Text
              className="text-accent"
              style={{ fontSize: 24, lineHeight: 24 }}
            >
              {'←'}
            </Text>
          </Pressable>
        </Link>
        <HamburgerMenu />
      </View>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className={isDesktop ? 'flex-1 flex-row' : 'flex-1'}>
          <BrandPanel isDesktop={isDesktop} />
          <View
            className={
              isDesktop
                ? 'flex-1 items-center justify-center px-12 py-16'
                : 'items-center px-4 pb-12 pt-6'
            }
          >
            <View
              className={
                isDesktop
                  ? 'w-full max-w-[380px]'
                  : 'w-full max-w-[440px] rounded-2xl border border-border bg-surface p-5'
              }
            >
              {children}
            </View>
          </View>
        </View>
      </ScrollView>
    </Container>
  );
}

function BrandPanel({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View
      className={
        isDesktop
          ? 'flex-1 justify-center border-r border-border bg-bg px-16 py-20'
          : 'bg-bg px-5 pb-6 pt-8'
      }
    >
      <View
        className={
          isDesktop ? 'w-full max-w-[480px]' : 'mx-auto w-full max-w-[480px]'
        }
      >
        <Link href="/" asChild>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={copy.brand.wordmark}
            className={
              isDesktop
                ? 'mb-8 active:opacity-70'
                : 'mb-4 active:opacity-70'
            }
          >
            <Text
              className="font-serif text-fg"
              style={{
                fontSize: isDesktop ? 28 : 20,
                lineHeight: isDesktop ? 32 : 24,
              }}
            >
              {copy.brand.wordmark}
            </Text>
          </Pressable>
        </Link>

        <Text
          className="font-serif text-fg"
          style={{
            fontSize: isDesktop ? 28 : 18,
            lineHeight: isDesktop ? 36 : 25,
          }}
        >
          {copy.auth.brandPitch}
        </Text>
      </View>
    </View>
  );
}
