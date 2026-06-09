import { useEffect, useState } from "react";
import { supabase, hasSupabase } from "../lib/supabase";
import { AuthCtx } from "../hooks/useAuth";
import type { User } from "@supabase/supabase-js";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => hasSupabase());

  useEffect(() => {
    if (!hasSupabase()) return;
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) {
        setUser(data.session?.user ?? null);
        setLoading(false);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const refresh = async () => {
    if (!hasSupabase()) return;
    const { data } = await supabase.auth.getUser();
    setUser(data.user ?? null);
  };

  const signOut = async () => {
    if (!hasSupabase()) return;
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, signOut, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}
