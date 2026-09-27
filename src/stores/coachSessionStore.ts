import { create } from 'zustand';
import {
  SessionAction,
  SessionState,
  createInitialSession,
  sessionReducer,
} from '@/lib/cylinder/session';

interface CoachSessionStore {
  session: SessionState;
  dispatch: (action: SessionAction) => void;
}

/**
 * In-memory session for the cylinder lesson. Nothing is persisted: storage,
 * retention and parental consent are TBD in PRODUCT_SPEC (NFR-PRIV-002).
 */
export const useCoachSession = create<CoachSessionStore>((set) => ({
  session: createInitialSession(),
  dispatch: (action) => set((state) => ({ session: sessionReducer(state.session, action) })),
}));
