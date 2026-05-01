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

import { useSession } from '@/lib/auth';
import { COLORS } from '@/lib/constants';
import { copy } from '@/lib/copy';
import { supabase } from '@/lib/supabase';
import { signInSchema, type SignInInput } from '@/lib/validation';

// Typed `Href` doesn't admit a generic `/${string}` for arbitrary internal
// paths, so call sites that pass a runtime path cast to Href. The runtime
// guard here (must start with `/`, must not start with `//`) is what keeps
// the cast safe — blocks open-redirect to external origins.
function safeRedirect(raw: string | string[] | undefined): string {
  const r = Array.isArray(raw) ? raw[0] : raw;
  if (typeof r !== 'string') return '/dashboard';
  if (!r.startsWith('/') || r.startsWith('//')) return '/dashboard';
  return r;
}

export default function SignInScreen() {
  const session = useSession();
  const params = useLocalSearchParams<{ redirect?: string }>();
  const target = safeRedirect(params.redirect);
  const [banner, setBanner] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  });

  if (session.status === 'authenticated') {
    return <Redirect href={target as Href} />;
  }

  async function onSubmit(values: SignInInput) {
    setBanner(null);
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      setBanner(error.message || copy.auth.genericError);
      return;
    }
    router.replace(target as Href);
  }

  const switchHref: Href = params.redirect
    ? (`/sign-up?redirect=${encodeURIComponent(target)}` as Href)
    : '/sign-up';

  return (
    <>
      <Text className="mb-6 font-serif text-h1 text-fg">
        {copy.auth.signInTitle}
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
              className="rounded border border-border bg-surface px-3 py-3 text-body text-fg"
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
              autoComplete="password"
              textContentType="password"
              editable={!isSubmitting}
              placeholderTextColor={COLORS.muted}
              className="rounded border border-border bg-surface px-3 py-3 text-body text-fg"
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
          {isSubmitting ? copy.auth.signInLoading : copy.auth.signInCta}
        </Text>
      </Pressable>

      <Link href={switchHref} asChild>
        <Pressable className="mt-4 items-center" accessibilityRole="link">
          <Text className="text-meta text-muted underline">
            {copy.auth.switchToSignUp}
          </Text>
        </Pressable>
      </Link>
    </>
  );
}
