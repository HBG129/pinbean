import { supabase, db } from "./supabase";
import type { BeadGrid } from "../types/bead";
import type { CloudProject } from "./supabase";

export async function getMyProjects(): Promise<CloudProject[]> {
  const { data, error } = await db()
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function saveCloudProject(title: string, grid: BeadGrid, isPublic = false) {
  const { data: user } = await supabase!.auth.getUser();
  if (!user.user) throw new Error("请先登录");

  const { data, error } = await db()
    .from("projects")
    .insert({
      user_id: user.user.id,
      title,
      grid: JSON.stringify(grid),
      is_public: isPublic,
    })
    .select()
    .single();
  if (error) throw error;
  return data as CloudProject;
}

export async function deleteCloudProject(id: string) {
  const { error } = await db().from("projects").delete().eq("id", id);
  if (error) throw error;
}

export async function getCommunityFeed(sort: "latest" | "likes" | "comments" | "bookmarks" = "latest") {
  const column = sort === "latest" ? "created_at" : `${sort}_count`;
  const { data, error } = await db()
    .from("projects")
    .select("*")
    .eq("is_public", true)
    .order(column, { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}

export async function toggleLike(projectId: string) {
  const { data: user } = await supabase!.auth.getUser();
  if (!user.user) throw new Error("请先登录");

  const { data: existing } = await db()
    .from("likes")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", user.user.id)
    .maybeSingle();

  if (existing) {
    await db().from("likes").delete().eq("id", existing.id);
    await db().rpc("decrement_likes", { project_id: projectId });
  } else {
    await db().from("likes").insert({ project_id: projectId, user_id: user.user.id });
    await db().rpc("increment_likes", { project_id: projectId });
  }
}

export async function hasUserLiked(projectId: string): Promise<boolean> {
  const { data: user } = await supabase!.auth.getUser();
  if (!user.user) return false;
  const { data } = await db()
    .from("likes")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", user.user.id)
    .maybeSingle();
  return !!data;
}

export async function getComments(projectId: string) {
  const { data, error } = await db()
    .from("comments")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addComment(projectId: string, content: string) {
  const { data: user } = await supabase!.auth.getUser();
  if (!user.user) throw new Error("请先登录");
  const { error } = await db()
    .from("comments")
    .insert({ project_id: projectId, user_id: user.user.id, content });
  if (error) throw error;
  await db().rpc("increment_comments", { project_id: projectId });
}

export async function toggleBookmark(projectId: string) {
  const { data: user } = await supabase!.auth.getUser();
  if (!user.user) throw new Error("请先登录");

  const { data: existing } = await db()
    .from("bookmarks")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", user.user.id)
    .maybeSingle();

  if (existing) {
    await db().from("bookmarks").delete().eq("id", existing.id);
    await db().rpc("decrement_bookmarks", { project_id: projectId });
  } else {
    await db().from("bookmarks").insert({ project_id: projectId, user_id: user.user.id });
    await db().rpc("increment_bookmarks", { project_id: projectId });
  }
}
