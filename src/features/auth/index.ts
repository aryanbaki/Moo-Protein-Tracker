/**
 * Auth contract. BASE STUB: signed out, no backend. The accounts work wires
 * Supabase Auth behind these exports.
 */
import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string | null;
}

export interface AuthState {
  ready: boolean;
  user: AuthUser | null;
  /** True when Supabase env config is present. When false the app runs local-only. */
  backendConfigured: boolean;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthState>()((set) => ({
  ready: true,
  user: null,
  backendConfigured: false,
  signOut: async () => set({ user: null }),
}));
