import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

function getSupabase() {
  if (_supabase) return _supabase;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  _supabase = createClient(url || "", key || "");
  return _supabase;
}

export const supabase = getSupabase();

/** true if Supabase env vars are configured */
export const hasSupabase = () =>
  Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

export type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type CloudProject = {
  id: string;
  user_id: string;
  title: string;
  grid: string;
  thumbnail: string | null;
  is_public: boolean;
  likes_count: number;
  comments_count: number;
  bookmarks_count: number;
  created_at: string;
  updated_at: string;
};

export type Comment = {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  created_at: string;
};
