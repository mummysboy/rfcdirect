import { zodResolver } from '@hookform/resolvers/zod';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { LocationSearch } from '@/components/ui/LocationSearch';
import { TimeInput } from '@/components/ui/TimeInput';
import {
  durationLabel,
  parseTimeRange,
  serializeTimeRange,
} from '@/lib/practice';
import {
  CATEGORIES,
  COLORS,
  DAYS_OF_WEEK,
  DEFAULT_CATEGORY,
  DEFAULT_DIVISION,
  DIVISIONS,
} from '@/lib/constants';
import { categoryLabels, copy, dayLabels, divisionLabels } from '@/lib/copy';
import type { GeocodeResult } from '@/lib/geo';
import { clubFormSchema, type ClubFormInput } from '@/lib/validation';

import { BrandColorPicker } from './BrandColorPicker';
import { LogoUpload } from './LogoUpload';

export type ClubFormProps =
  | {
      mode: 'new';
      onSubmit: (
        values: ClubFormInput,
        logoUrl: string | null,
      ) => Promise<void>;
    }
  | {
      mode: 'edit';
      clubId: string;
      currentLogoUrl: string | null;
      defaultValues: ClubFormInput;
      onSubmit: (
        values: ClubFormInput,
        logoUrl: string | null,
      ) => Promise<void>;
    };

const NEW_DEFAULTS: ClubFormInput = {
  name: '',
  description: '',
  year_founded: null,
  division: DEFAULT_DIVISION,
  category: DEFAULT_CATEGORY,
  address_display: '',
  practice_location_label: null,
  latitude: null,
  longitude: null,
  website_url: null,
  social_instagram: null,
  social_facebook: null,
  contact_email: null,
  contact_phone: null,
  brand_color: null,
  practice_days: [],
  practice_times: null,
};

export function ClubForm(props: ClubFormProps) {
  const isEdit = props.mode === 'edit';
  const initialLogo = isEdit ? props.currentLogoUrl : null;
  const initialAddress = isEdit ? props.defaultValues.address_display : '';

  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogo);
  const [banner, setBanner] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState(0);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClubFormInput>({
    resolver: zodResolver(clubFormSchema),
    defaultValues: isEdit ? props.defaultValues : NEW_DEFAULTS,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (savedAt === 0) return;
    const t = setTimeout(() => setSavedAt(0), 2000);
    return () => clearTimeout(t);
  }, [savedAt]);

  function onAddressSelect(r: GeocodeResult) {
    setValue('address_display', r.placeName, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue('latitude', r.latitude, { shouldDirty: true });
    setValue('longitude', r.longitude, { shouldDirty: true });
  }

  async function onValidSubmit(values: ClubFormInput) {
    setBanner(null);
    try {
      await props.onSubmit(values, logoUrl);
      setSavedAt(Date.now());
    } catch (e) {
      setBanner((e as Error).message || copy.errors.network);
    }
  }

  const submitLabel = isSubmitting
    ? copy.admin.savingState
    : savedAt > 0
      ? copy.admin.saveSuccess
      : copy.admin.saveCta;

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 20,
        gap: 28,
      }}
    >
      <View className="gap-3">
        <FieldRow label={copy.club.fields.name} error={errors.name?.message}>
          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="words"
                editable={!isSubmitting}
                placeholderTextColor={COLORS.muted}
                className="rounded border border-border bg-surface px-3 py-3 text-body text-fg"
              />
            )}
          />
        </FieldRow>

        <FieldRow
          label={copy.club.fields.founded}
          error={errors.year_founded?.message}
        >
          <Controller
            control={control}
            name="year_founded"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                value={value == null ? '' : String(value)}
                onChangeText={(t) => {
                  const cleaned = t.replace(/\D/g, '');
                  onChange(cleaned === '' ? null : parseInt(cleaned, 10));
                }}
                onBlur={onBlur}
                keyboardType="number-pad"
                maxLength={4}
                editable={!isSubmitting}
                placeholderTextColor={COLORS.muted}
                className="rounded border border-border bg-surface px-3 py-3 text-body text-fg"
              />
            )}
          />
        </FieldRow>

        <FieldRow
          label={copy.club.sections.about}
          error={errors.description?.message}
        >
          <Controller
            control={control}
            name="description"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                numberOfLines={5}
                editable={!isSubmitting}
                placeholderTextColor={COLORS.muted}
                className="rounded border border-border bg-surface px-3 py-3 text-body text-fg"
                style={{ minHeight: 120, textAlignVertical: 'top' }}
              />
            )}
          />
        </FieldRow>

        <Controller
          control={control}
          name="brand_color"
          render={({ field: { value, onChange } }) => (
            <BrandColorPicker
              value={value}
              onChange={onChange}
              error={errors.brand_color?.message}
            />
          )}
        />
      </View>

      <View className="gap-3">
        <FieldRow
          label={copy.club.fields.division}
          error={errors.division?.message}
        >
          <Controller
            control={control}
            name="division"
            render={({ field: { value, onChange } }) => (
              <SegmentedSelect
                value={value}
                onChange={onChange}
                options={DIVISIONS}
                labels={divisionLabels}
                disabled={isSubmitting}
              />
            )}
          />
        </FieldRow>

        <FieldRow
          label={copy.club.fields.category}
          error={errors.category?.message}
        >
          <Controller
            control={control}
            name="category"
            render={({ field: { value, onChange } }) => (
              <SegmentedSelect
                value={value}
                onChange={onChange}
                options={CATEGORIES}
                labels={categoryLabels}
                disabled={isSubmitting}
              />
            )}
          />
        </FieldRow>
      </View>

      <View className="gap-3">
        <View>
          <Text className="mb-2 text-eyebrow uppercase tracking-eyebrow text-muted">
            {copy.club.fields.location}
          </Text>
          <LocationSearch
            initialValue={initialAddress}
            onSelect={onAddressSelect}
          />
          {errors.address_display ? (
            <Text className="mt-1 text-meta text-accent">
              {errors.address_display.message}
            </Text>
          ) : null}
        </View>

        <FieldRow
          label={copy.club.fields.practiceLocationLabel}
          error={errors.practice_location_label?.message}
        >
          <Controller
            control={control}
            name="practice_location_label"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                value={value ?? ''}
                onChangeText={(t) => onChange(t === '' ? null : t)}
                onBlur={onBlur}
                editable={!isSubmitting}
                placeholderTextColor={COLORS.muted}
                className="rounded border border-border bg-surface px-3 py-3 text-body text-fg"
              />
            )}
          />
        </FieldRow>
      </View>

      <View className="gap-3">
        <FieldRow
          label={copy.club.fields.practiceDays}
          error={errors.practice_days?.message}
        >
          <Controller
            control={control}
            name="practice_days"
            render={({ field: { value, onChange } }) => (
              <MultiSelectPills
                value={value}
                onChange={onChange}
                options={DAYS_OF_WEEK}
                labels={dayLabels}
                disabled={isSubmitting}
              />
            )}
          />
        </FieldRow>

        <FieldRow
          label={copy.club.fields.practiceTimes}
          error={errors.practice_times?.message}
        >
          <Controller
            control={control}
            name="practice_times"
            render={({ field: { value, onChange } }) => {
              const { start, end } = parseTimeRange(value);
              const update = (s: string, e: string) =>
                onChange(serializeTimeRange(s, e));
              const duration = durationLabel(start, end);
              return (
                <View>
                  <View className="flex-row items-center gap-3">
                    <View className="flex-1">
                      <TimeInput
                        value={start}
                        onChange={(v) => update(v, end)}
                        disabled={isSubmitting}
                        ariaLabel="Practice start time"
                      />
                    </View>
                    <Text className="text-meta text-muted">to</Text>
                    <View className="flex-1">
                      <TimeInput
                        value={end}
                        onChange={(v) => update(start, v)}
                        disabled={isSubmitting}
                        ariaLabel="Practice end time"
                      />
                    </View>
                  </View>
                  {duration ? (
                    <Text className="mt-2 text-meta text-muted">
                      {duration}
                    </Text>
                  ) : null}
                </View>
              );
            }}
          />
        </FieldRow>
      </View>

      {isEdit ? (
        <LogoUpload
          clubId={props.clubId}
          currentLogoUrl={logoUrl}
          onUploaded={setLogoUrl}
        />
      ) : null}

      <View className="gap-3">
        <FieldRow
          label={copy.club.fields.website}
          error={errors.website_url?.message}
        >
          <Controller
            control={control}
            name="website_url"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                value={value ?? ''}
                onChangeText={(t) => onChange(t === '' ? null : t)}
                onBlur={onBlur}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
                placeholderTextColor={COLORS.muted}
                className="rounded border border-border bg-surface px-3 py-3 text-body text-fg"
              />
            )}
          />
        </FieldRow>

        <FieldRow
          label="Instagram"
          error={errors.social_instagram?.message}
        >
          <Controller
            control={control}
            name="social_instagram"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                value={value ?? ''}
                onChangeText={(t) => onChange(t === '' ? null : t)}
                onBlur={onBlur}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
                placeholderTextColor={COLORS.muted}
                className="rounded border border-border bg-surface px-3 py-3 text-body text-fg"
              />
            )}
          />
        </FieldRow>

        <FieldRow
          label="Facebook"
          error={errors.social_facebook?.message}
        >
          <Controller
            control={control}
            name="social_facebook"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                value={value ?? ''}
                onChangeText={(t) => onChange(t === '' ? null : t)}
                onBlur={onBlur}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
                placeholderTextColor={COLORS.muted}
                className="rounded border border-border bg-surface px-3 py-3 text-body text-fg"
              />
            )}
          />
        </FieldRow>

        <FieldRow
          label={copy.club.fields.email}
          error={errors.contact_email?.message}
        >
          <Controller
            control={control}
            name="contact_email"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                value={value ?? ''}
                onChangeText={(t) => onChange(t === '' ? null : t)}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
                placeholderTextColor={COLORS.muted}
                className="rounded border border-border bg-surface px-3 py-3 text-body text-fg"
              />
            )}
          />
        </FieldRow>

        <FieldRow
          label={copy.club.fields.phone}
          error={errors.contact_phone?.message}
        >
          <Controller
            control={control}
            name="contact_phone"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                value={value ?? ''}
                onChangeText={(t) => onChange(t === '' ? null : t)}
                onBlur={onBlur}
                keyboardType="phone-pad"
                editable={!isSubmitting}
                placeholderTextColor={COLORS.muted}
                className="rounded border border-border bg-surface px-3 py-3 text-body text-fg"
              />
            )}
          />
        </FieldRow>
      </View>

      {banner ? (
        <View className="rounded border border-accent px-3 py-2">
          <Text className="text-meta text-accent">{banner}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={handleSubmit(onValidSubmit)}
        disabled={isSubmitting}
        accessibilityRole="button"
        style={{ opacity: isSubmitting ? 0.6 : 1 }}
        className="items-center rounded-full bg-fg py-3"
      >
        <Text className="text-body font-medium text-bg">{submitLabel}</Text>
      </Pressable>
    </ScrollView>
  );
}

function FieldRow({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <View>
      <Text className="mb-1 text-meta text-muted">{label}</Text>
      {children}
      {error ? (
        <Text className="mt-1 text-meta text-accent">{error}</Text>
      ) : null}
    </View>
  );
}

function MultiSelectPills<T extends string>({
  value,
  onChange,
  options,
  labels,
  disabled,
}: {
  value: T[];
  onChange: (v: T[]) => void;
  options: readonly T[];
  labels: Record<T, string>;
  disabled?: boolean;
}) {
  const set = new Set(value);
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((opt) => {
        const selected = set.has(opt);
        return (
          <Pressable
            key={opt}
            onPress={() => {
              const next = new Set(set);
              if (selected) next.delete(opt);
              else next.add(opt);
              onChange(options.filter((o) => next.has(o)));
            }}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled }}
            className={
              selected
                ? 'rounded-full bg-fg px-4 py-2'
                : 'rounded-full border border-border bg-surface px-4 py-2'
            }
          >
            <Text
              className={
                selected
                  ? 'text-meta font-medium text-bg'
                  : 'text-meta text-fg'
              }
            >
              {labels[opt]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SegmentedSelect<T extends string>({
  value,
  onChange,
  options,
  labels,
  disabled,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly T[];
  labels: Record<T, string>;
  disabled?: boolean;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((opt) => {
        const selected = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled }}
            className={
              selected
                ? 'rounded-full bg-fg px-4 py-2'
                : 'rounded-full border border-border bg-surface px-4 py-2'
            }
          >
            <Text
              className={
                selected
                  ? 'text-meta font-medium text-bg'
                  : 'text-meta text-fg'
              }
            >
              {labels[opt]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
