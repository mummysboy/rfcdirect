import type { PropsWithChildren } from 'react';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

type Props = {
  edges?: readonly Edge[];
};

export function Container({
  children,
  edges = ['top', 'bottom'],
}: PropsWithChildren<Props>) {
  return (
    <SafeAreaView
      className="flex-1 bg-bg"
      edges={edges}
      style={{ minWidth: 0, maxWidth: '100%' }}
    >
      {children}
    </SafeAreaView>
  );
}
