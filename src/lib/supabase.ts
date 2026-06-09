import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  grid: string; // JSON stringified BeadGrid
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
