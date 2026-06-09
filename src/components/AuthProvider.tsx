import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { AuthCtx } from "../hooks/useAuth";
import type { User } from "@supabase/supabase-js";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user ?? null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, signOut, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}
