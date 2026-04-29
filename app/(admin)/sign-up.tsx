import { zodResolver } from '@hookform/resolvers/zod';
import {
  Link,
  Redirect,
  router,
  useLocalSearchParams,
  type Href,
} from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '@/lib/auth';
import { COLORS } from '@/lib/constants';
import { copy } from '@/lib/copy';
import { supabase } from '@/lib/supabase';
import { signUpSchema, type SignUpInput } from '@/lib/validation';

// See sign-in.tsx for why this cast is what it is.
function safeRedirect(raw: string | string[] | undefined): string {
  const r = Array.isArray(raw) ? raw[0] : raw;
  if (typeof r !== 'string') return '/dashboard';
  if (!r.startsWith('/') || r.startsWith('//')) return '/dashboard';
  return r;
}

export default function SignUpScreen() {
  const session = useSession();
  const params = useLocalSearchParams<{ redirect?: string }>();
  const target = safeRedirect(params.redirect);
  const [banner, setBanner] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  });

  if (session.status === 'authenticated') {
    return <Redirect href={target as Href} />;
  }

  async function onSubmit(values: SignUpInput) {
    setBanner(null);
    const { data, error } = await supabase.auth.signUp(values);
    if (error) {
      setBanner(error.message || copy.auth.genericError);
      return;
    }
    // With email confirmation off (v1 default), the response includes a session
    // and onAuthStateChange will fire SIGNED_IN. We just navigate.
    if (!data.session) {
      // Confirmation is on in the Supabase project — surface a message rather
      // than silently leaving the user stuck on the form.
      setBanner(copy.auth.genericError);
      return;
    }
    router.replace(target as Href);
  }

  const switchHref: Href = params.redirect
    ? (`/sign-in?redirect=${encodeURIComponent(target)}` as Href)
    : '/sign-in';

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-full max-w-[380px] rounded-2xl border border-border bg-surface p-6">
          <Text className="mb-6 font-serif text-h1 text-fg">
            {copy.auth.signUpTitle}
          </Text>

          {banner ? (
            <View className="mb-4 rounded border border-accent px-3 py-2">
              <Text className="text-meta text-accent">{banner}</Text>
            </View>
          ) : null}

          <View className="mb-4">
            <Text className="mb-1 text-meta text-muted">
              {copy.auth.emailLabel}
            </Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  editable={!isSubmitting}
                  placeholderTextColor={COLORS.muted}
                  className="rounded border border-border bg-bg px-3 py-3 text-body text-fg"
                />
              )}
            />
            {errors.email ? (
              <Text className="mt-1 text-meta text-accent">
                {errors.email.message}
              </Text>
            ) : null}
          </View>

          <View className="mb-6">
            <Text className="mb-1 text-meta text-muted">
              {copy.auth.passwordLabel}
            </Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password-new"
                  textContentType="newPassword"
                  editable={!isSubmitting}
                  placeholderTextColor={COLORS.muted}
                  className="rounded border border-border bg-bg px-3 py-3 text-body text-fg"
                />
              )}
            />
            {errors.password ? (
              <Text className="mt-1 text-meta text-accent">
                {errors.password.message}
              </Text>
            ) : null}
          </View>

          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            accessibilityRole="button"
            style={{ opacity: isSubmitting ? 0.6 : 1 }}
            className="items-center rounded-full bg-fg py-3"
          >
            <Text className="text-body font-medium text-bg">
              {isSubmitting ? copy.auth.signUpLoading : copy.auth.signUpCta}
            </Text>
          </Pressable>

          <Link href={switchHref} asChild>
            <Pressable className="mt-4 items-center" accessibilityRole="link">
              <Text className="text-meta text-muted underline">
                {copy.auth.switchToSignIn}
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
