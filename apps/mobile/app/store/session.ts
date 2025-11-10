import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';

interface SessionStore {
  session: Session | null;
  guestSessionId: string | null;
  setSession: (session: Session | null) => void;
  setGuestSessionId: (id: string | null) => void;
  isGuest: () => boolean;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  session: null,
  guestSessionId: null,
  setSession: (session) => set({ session }),
  setGuestSessionId: (id) => set({ guestSessionId: id }),
  isGuest: () => get().session === null && get().guestSessionId !== null,
}));

