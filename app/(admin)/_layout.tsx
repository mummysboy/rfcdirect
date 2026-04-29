import { Stack } from 'expo-router';

// Auth gating to be added once Supabase auth is wired up.
// Unauthenticated users on protected routes should be redirected to sign-in.
export default function AdminLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
