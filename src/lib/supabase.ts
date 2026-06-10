import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !key) return null;
  if (!_supabase) _supabase = createClient(url, key);
  return _supabase;
}

export function db(): SupabaseClient {
  const s = getSupabase();
  if (!s) throw new Error("Supabase 未配置");
  return s;
}

export const supabase = getSupabase();

export const hasSupabase = (): boolean =>
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
  description: string | null;
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
  parent_id: string | null;
  content: string;
  created_at: string;
};
