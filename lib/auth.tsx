import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';

import { supabase } from './supabase';

export type SessionState =
  | { status: 'loading'; session: null; user: null }
  | { status: 'authenticated'; session: Session; user: User }
  | { status: 'unauthenticated'; session: null; user: null };

const initialState: SessionState = {
  status: 'loading',
  session: null,
  user: null,
};

const SessionContext = createContext<SessionState | null>(null);

function fromSession(session: Session | null): SessionState {
  return session
    ? { status: 'authenticated', session, user: session.user }
    : { status: 'unauthenticated', session: null, user: null };
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<SessionState>(initialState);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setState(fromSession(data.session));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setState(fromSession(session));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SessionContext.Provider value={state}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionState {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return value;
}

export async function signOut() {
  return supabase.auth.signOut();
}
