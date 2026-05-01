import { Slot, usePathname } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AuthLayout } from '@/components/ui/AuthLayout';

/**
 * Wraps /sign-in and /sign-up in a single shared `AuthLayout` so the brand
 * panel + top bar persist across the swap. Reanimated's FadeIn uses CSS-based
 * transitions on web (frame-perfect) and worklet-driven on native — much
 * smoother than React Native's JS-driven Animated, which drops frames during
 * route changes. `key={pathname}` makes the wrapper re-mount on each route
 * swap so FadeIn fires.
 */
export default function AuthGroupLayout() {
  const pathname = usePathname();
  return (
    <AuthLayout>
      <Animated.View key={pathname} entering={FadeIn.duration(180)}>
        <Slot />
      </Animated.View>
    </AuthLayout>
  );
}
