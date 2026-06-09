import { createContext, useContext } from "react";
import type { User } from "@supabase/supabase-js";

export type AuthState = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

export const AuthCtx = createContext<AuthState>({
  user: null,
  loading: true,
  signOut: async () => {},
  refresh: async () => {},
});

export function useAuth() {
  return useContext(AuthCtx);
}
