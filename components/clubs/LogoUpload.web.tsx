import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { STORAGE_BUCKETS } from '@/lib/constants';
import { copy } from '@/lib/copy';
import { supabase } from '@/lib/supabase';

type Props = {
  clubId: string;
  currentLogoUrl: string | null;
  onUploaded: (logoUrl: string) => void;
};

const MAX_DIM = 1024;
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_INPUT_BYTES = MAX_BYTES * 8;

export function LogoUpload({ clubId, currentLogoUrl, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentLogoUrl);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const blob = await resizeImage(file);
      const ext = blob.type === 'image/png' ? 'png' : 'jpg';
      const path = `${clubId}/logo.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.logos)
        .upload(path, blob, { upsert: true, contentType: blob.type });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from(STORAGE_BUCKETS.logos).getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      setPreview(url);
      onUploaded(url);
    } catch (e) {
      setError((e as Error).message || copy.errors.uploadFailed);
    } finally {
      setUploading(false);
    }
  }

  return (
    <View>
      {preview ? (
        <Image
          source={preview}
          contentFit="cover"
          style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#FFFFFF' }}
          accessibilityLabel="Club logo preview"
        />
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = '';
        }}
      />

      <Pressable
        onPress={() => inputRef.current?.click()}
        disabled={uploading}
        accessibilityRole="button"
        style={{ opacity: uploading ? 0.6 : 1 }}
        className="mt-3 self-start rounded-full border border-border bg-surface px-4 py-2"
      >
        <Text className="text-meta text-fg">
          {uploading
            ? copy.admin.savingState
            : preview
              ? copy.admin.replaceLogo
              : copy.admin.uploadLogo}
        </Text>
      </Pressable>

      {error ? (
        <Text className="mt-2 text-meta text-accent">{error}</Text>
      ) : null}
    </View>
  );
}

async function resizeImage(file: File): Promise<Blob> {
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error(copy.errors.uploadFailed);
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new window.Image();
    i.onerror = () => reject(new Error(copy.errors.uploadFailed));
    i.onload = () => resolve(i);
    i.src = dataUrl;
  });

  let { width, height } = img;
  if (width > MAX_DIM || height > MAX_DIM) {
    const scale = Math.min(MAX_DIM / width, MAX_DIM / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error(copy.errors.uploadFailed);
  ctx.drawImage(img, 0, 0, width, height);

  // JPEG for photos, PNG to preserve alpha (most logos are PNGs with transparency).
  const type: 'image/png' | 'image/jpeg' =
    file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error(copy.errors.uploadFailed))),
      type,
      type === 'image/jpeg' ? 0.85 : undefined,
    );
  });

  if (blob.size > MAX_BYTES) {
    throw new Error(copy.errors.uploadFailed);
  }
  return blob;
}
