import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import type { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Defer the misconfiguration error until something actually uses the client.
// Throwing at module load breaks Expo's static-render pass on platforms that
// don't expose EXPO_PUBLIC_* to the build environment, even though the same
// values reach the runtime bundle just fine.
function missingEnvError(): never {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in values.',
  );
}

export const supabase: SupabaseClient<Database> =
  supabaseUrl && supabaseAnonKey
    ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          storage: Platform.OS === 'web' ? undefined : AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: Platform.OS === 'web',
        },
      })
    : new Proxy({} as SupabaseClient<Database>, {
        get: () => missingEnvError(),
        apply: () => missingEnvError(),
      });
