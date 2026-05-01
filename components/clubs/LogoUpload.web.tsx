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
const PREVIEW_SIZE = 112;
const FRAME_SIZE = 280;

type Pending = {
  file: File;
  dataUrl: string;
  naturalW: number;
  naturalH: number;
};

export function LogoUpload({ clubId, currentLogoUrl, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentLogoUrl);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [scale, setScale] = useState(1);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    tx0: number;
    ty0: number;
  } | null>(null);

  async function onFilePicked(file: File) {
    setError(null);
    if (file.size > MAX_INPUT_BYTES) {
      setError(copy.errors.uploadFailed);
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      const img = await loadImage(dataUrl);
      const fit = FRAME_SIZE / Math.min(img.naturalWidth, img.naturalHeight);
      setPending({
        file,
        dataUrl,
        naturalW: img.naturalWidth,
        naturalH: img.naturalHeight,
      });
      setTx(0);
      setTy(0);
      setScale(fit);
    } catch (e) {
      setError((e as Error).message || copy.errors.uploadFailed);
    }
  }

  async function onConfirm() {
    if (!pending) return;
    setError(null);
    setUploading(true);
    try {
      const blob = await renderCropped(pending, tx, ty, scale);
      const ext = blob.type === 'image/png' ? 'png' : 'jpg';
      const path = `${clubId}/logo.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.logos)
        .upload(path, blob, { upsert: true, contentType: blob.type });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage
        .from(STORAGE_BUCKETS.logos)
        .getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      setPreview(url);
      onUploaded(url);
      setPending(null);
    } catch (e) {
      setError((e as Error).message || copy.errors.uploadFailed);
    } finally {
      setUploading(false);
    }
  }

  function onCancel() {
    setPending(null);
    setError(null);
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      tx0: tx,
      ty0: ty,
    };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = dragRef.current;
    if (!d) return;
    setTx(d.tx0 + (e.clientX - d.startX));
    setTy(d.ty0 + (e.clientY - d.startY));
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
  }

  function onWheel(e: React.WheelEvent<HTMLDivElement>) {
    if (!pending) return;
    e.preventDefault();
    const minScale = FRAME_SIZE / Math.max(pending.naturalW, pending.naturalH);
    const maxScale = 8;
    const next = scale * (e.deltaY > 0 ? 0.9 : 1.1);
    setScale(Math.max(minScale, Math.min(maxScale, next)));
  }

  return (
    <View>
      {!pending && preview ? (
        <Image
          source={preview}
          contentFit="cover"
          style={{
            width: PREVIEW_SIZE,
            height: PREVIEW_SIZE,
            borderRadius: PREVIEW_SIZE / 2,
            backgroundColor: '#FFFFFF',
          }}
          accessibilityLabel="Club logo preview"
        />
      ) : null}

      {pending ? (
        <View>
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
            style={{
              width: FRAME_SIZE,
              height: FRAME_SIZE,
              borderRadius: FRAME_SIZE / 2,
              overflow: 'hidden',
              backgroundColor: '#FFFFFF',
              touchAction: 'none',
              cursor: 'grab',
              position: 'relative',
              userSelect: 'none',
            }}
          >
            <img
              src={pending.dataUrl}
              alt=""
              draggable={false}
              style={{
                position: 'absolute',
                left: FRAME_SIZE / 2 + tx,
                top: FRAME_SIZE / 2 + ty,
                width: pending.naturalW * scale,
                height: pending.naturalH * scale,
                transform: 'translate(-50%, -50%)',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />
          </div>
          <Text className="mt-2 text-meta text-muted">{copy.admin.cropHint}</Text>

          <View className="mt-3 flex-row gap-2">
            <Pressable
              onPress={onConfirm}
              disabled={uploading}
              accessibilityRole="button"
              style={{ opacity: uploading ? 0.6 : 1 }}
              className="self-start rounded-full bg-fg px-4 py-2"
            >
              <Text className="text-meta font-medium text-bg">
                {uploading ? copy.admin.savingState : copy.admin.cropSave}
              </Text>
            </Pressable>
            <Pressable
              onPress={onCancel}
              disabled={uploading}
              accessibilityRole="button"
              style={{ opacity: uploading ? 0.6 : 1 }}
              className="self-start rounded-full border border-border bg-surface px-4 py-2"
            >
              <Text className="text-meta text-fg">{copy.admin.cropCancel}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onFilePicked(f);
          e.target.value = '';
        }}
      />

      {!pending ? (
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
      ) : null}

      {error ? (
        <Text className="mt-2 text-meta text-accent">{error}</Text>
      ) : null}
    </View>
  );
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const i = new window.Image();
    i.onerror = () => reject(new Error(copy.errors.uploadFailed));
    i.onload = () => resolve(i);
    i.src = src;
  });
}

// Map the visible circular frame back to source-image pixels and bake the
// chosen crop into a square canvas. The output is at most MAX_DIM on each
// side, capped down if the user zoomed in past the source resolution.
async function renderCropped(
  pending: Pending,
  tx: number,
  ty: number,
  scale: number,
): Promise<Blob> {
  const img = await loadImage(pending.dataUrl);
  const srcSize = FRAME_SIZE / scale;
  const srcX = pending.naturalW / 2 - (FRAME_SIZE / 2 + tx) / scale;
  const srcY = pending.naturalH / 2 - (FRAME_SIZE / 2 + ty) / scale;

  const outSize = Math.min(MAX_DIM, Math.round(srcSize));
  const canvas = document.createElement('canvas');
  canvas.width = outSize;
  canvas.height = outSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error(copy.errors.uploadFailed);

  // White fill so panning past the source edge produces white instead of the
  // canvas's transparent default — matches the avatar background everywhere.
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, outSize, outSize);
  ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, outSize, outSize);

  const type: 'image/png' | 'image/jpeg' =
    pending.file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error(copy.errors.uploadFailed))),
      type,
      type === 'image/jpeg' ? 0.85 : undefined,
    );
  });

  if (blob.size > MAX_BYTES) throw new Error(copy.errors.uploadFailed);
  return blob;
}
