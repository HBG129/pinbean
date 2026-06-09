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

/** rename a project */
export async function updateCloudProject(id: string, title: string) {
  const { error } = await db()
    .from("projects")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/** toggle is_public on a project */
export async function toggleProjectPublic(id: string) {
  const { data: current } = await db().from("projects").select("is_public").eq("id", id).single();
  if (!current) throw new Error("作品不存在");
  const { error } = await db()
    .from("projects")
    .update({ is_public: !current.is_public, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  return !current.is_public;
}

export async function getCommunityFeed(sort: "latest" | "likes" | "comments" | "bookmarks" | "hot" = "latest") {
  // "hot" uses a composite score
  if (sort === "hot") {
    const { data, error } = await db()
      .from("projects")
      .select("*")
      .eq("is_public", true)
      .order("likes_count", { ascending: false })
      .limit(50);
    if (error) throw error;
    // sort by composite score client-side
    const scored = (data || []).map((p: CloudProject) => ({
      ...p,
      _score: p.likes_count * 2 + p.comments_count * 3 + p.bookmarks_count * 5,
    }));
    scored.sort((a, b) => (b._score - a._score));
    return scored as CloudProject[];
  }
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

export async function addComment(projectId: string, content: string, parentId?: string) {
  const { data: user } = await supabase!.auth.getUser();
  if (!user.user) throw new Error("请先登录");
  const { error } = await db()
    .from("comments")
    .insert({ project_id: projectId, user_id: user.user.id, content, parent_id: parentId || null });
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

/** profile: get user's own projects */
export async function getUserProjects() {
  const { data: user } = await supabase!.auth.getUser();
  if (!user.user) throw new Error("请先登录");
  const { data, error } = await db()
    .from("projects")
    .select("*")
    .eq("user_id", user.user.id)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

/** profile: get projects user liked */
export async function getUserLikedProjects(): Promise<CloudProject[]> {
  const { data: user } = await supabase!.auth.getUser();
  if (!user.user) throw new Error("请先登录");
  const { data: likeRows, error: e1 } = await db()
    .from("likes")
    .select("project_id")
    .eq("user_id", user.user.id);
  if (e1 || !likeRows?.length) return [];
  const ids = likeRows.map((r: { project_id: string }) => r.project_id);
  const { data, error: e2 } = await db()
    .from("projects")
    .select("*")
    .in("id", ids)
    .order("updated_at", { ascending: false });
  if (e2) throw e2;
  return data || [];
}

/** profile: get projects user bookmarked */
export async function getUserBookmarkedProjects(): Promise<CloudProject[]> {
  const { data: user } = await supabase!.auth.getUser();
  if (!user.user) throw new Error("请先登录");
  const { data: bmRows, error: e1 } = await db()
    .from("bookmarks")
    .select("project_id")
    .eq("user_id", user.user.id);
  if (e1 || !bmRows?.length) return [];
  const ids = bmRows.map((r: { project_id: string }) => r.project_id);
  const { data, error: e2 } = await db()
    .from("projects")
    .select("*")
    .in("id", ids)
    .order("updated_at", { ascending: false });
  if (e2) throw e2;
  return data || [];
}

/** get user notification counts */
export async function getUnreadCount(): Promise<number> {
  const { data: user } = await supabase!.auth.getUser();
  if (!user.user) return 0;
  const { count, error } = await db()
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.user.id)
    .eq("read", false);
  if (error) return 0;
  return count ?? 0;
}

/** get all notifications */
export async function getNotifications() {
  const { data: user } = await supabase!.auth.getUser();
  if (!user.user) throw new Error("请先登录");
  const { data, error } = await db()
    .from("notifications")
    .select("*")
    .eq("user_id", user.user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}

/** mark single notification as read */
export async function markRead(notifId: string) {
  await db().from("notifications").update({ read: true }).eq("id", notifId);
}

/** mark all as read */
export async function markAllRead() {
  const { data: user } = await supabase!.auth.getUser();
  if (!user.user) return;
  await db().from("notifications").update({ read: true }).eq("user_id", user.user.id).eq("read", false);
}
