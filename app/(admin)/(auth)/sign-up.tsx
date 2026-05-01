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
import { signUpSchema, type SignUpInput } from '@/lib/validation';

// See sign-in.tsx for why this cast is what it is.
function safeRedirect(raw: string | string[] | undefined): string {
  const r = Array.isArray(raw) ? raw[0] : raw;
  if (typeof r !== 'string') return '/';
  if (!r.startsWith('/') || r.startsWith('//')) return '/';
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
    defaultValues: {
      email: '',
      password: '',
      isManager: false,
      isPlayer: false,
    },
    mode: 'onBlur',
  });

  if (session.status === 'authenticated') {
    return <Redirect href={target as Href} />;
  }

  async function onSubmit(values: SignUpInput) {
    setBanner(null);
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        // Read by the on_auth_user_created trigger to populate public.profiles.
        data: {
          is_manager: values.isManager,
          is_player: values.isPlayer,
        },
      },
    });
    if (error) {
      setBanner(error.message || copy.auth.genericError);
      return;
    }
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
    <>
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

      <View className="mb-4">
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

      <Text className="mb-2 text-meta text-muted">
        {copy.auth.selectRoleLabel}
      </Text>

      <Controller
        control={control}
        name="isManager"
        render={({ field: { value, onChange } }) => (
          <RoleOption
            label={copy.auth.roleManagerLabel}
            checked={value}
            onToggle={() => onChange(!value)}
            disabled={isSubmitting}
          />
        )}
      />
      <View className="h-2" />
      <Controller
        control={control}
        name="isPlayer"
        render={({ field: { value, onChange } }) => (
          <RoleOption
            label={copy.auth.rolePlayerLabel}
            checked={value}
            onToggle={() => onChange(!value)}
            disabled={isSubmitting}
          />
        )}
      />
      {errors.isManager ? (
        <Text className="mt-2 text-meta text-accent">
          {errors.isManager.message}
        </Text>
      ) : null}

      <View className="h-6" />

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
    </>
  );
}

type RoleOptionProps = {
  label: string;
  checked: boolean;
  onToggle: () => void;
  disabled: boolean;
};

function RoleOption({ label, checked, onToggle, disabled }: RoleOptionProps) {
  return (
    <Pressable
      onPress={onToggle}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
      style={{ opacity: disabled ? 0.6 : 1 }}
      className={`flex-row items-center rounded border px-3 py-3 ${
        checked
          ? 'border-fg bg-surface'
          : 'border-border bg-surface active:bg-bg'
      }`}
    >
      <View
        className={`mr-3 h-5 w-5 items-center justify-center rounded ${
          checked ? 'bg-fg' : 'border border-border bg-bg'
        }`}
      >
        {checked ? (
          <Text className="text-meta font-medium text-bg">✓</Text>
        ) : null}
      </View>
      <Text className="flex-1 text-body font-medium text-fg">{label}</Text>
    </Pressable>
  );
}
