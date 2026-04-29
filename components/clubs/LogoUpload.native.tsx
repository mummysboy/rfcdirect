import { Text, View } from 'react-native';

type Props = {
  clubId: string;
  currentLogoUrl: string | null;
  onUploaded: (logoUrl: string) => void;
};

// Native upload requires expo-image-picker + expo-image-manipulator. Both are
// dep adds we deferred for v1; web is the primary target. Keep the same prop
// surface so the platform fork stays clean once we add native.
export function LogoUpload(_props: Props) {
  return (
    <View className="rounded border border-border bg-bg px-3 py-3">
      <Text className="text-meta text-muted">Logo upload available on web</Text>
    </View>
  );
}
