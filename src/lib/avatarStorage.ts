import { supabase } from "./supabase";

const BUCKET = "avatars";

/** ensure storage bucket exists */
export async function ensureAvatarsBucket() {
  const { data: buckets } = await supabase!.storage.listBuckets();
  if (!buckets?.find((b) => b.name === BUCKET)) {
    await supabase!.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 2_000_000 });
  }
}

/** upload avatar and return public URL */
export async function uploadAvatar(file: File): Promise<string> {
  const { data: user } = await supabase!.auth.getUser();
  if (!user.user) throw new Error("请先登录");

  await ensureAvatarsBucket();

  const ext = file.name.split(".").pop() || "png";
  const path = `${user.user.id}.${ext}`;

  const { error } = await supabase!.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw error;

  const { data: urlData } = supabase!.storage.from(BUCKET).getPublicUrl(path);
  return urlData.publicUrl;
}

/** get current user's avatar URL (null if none) */
export async function getAvatarUrl(): Promise<string | null> {
  const { data: user } = await supabase!.auth.getUser();
  if (!user.user) return null;

  // try common extensions
  for (const ext of ["png", "jpg", "jpeg", "webp"]) {
    const path = `${user.user.id}.${ext}`;
    try {
      const { data } = await supabase!.storage.from(BUCKET).createSignedUrl(path, 60);
      if (data) {
        const { data: urlData } = supabase!.storage.from(BUCKET).getPublicUrl(path);
        return urlData.publicUrl;
      }
    } catch { /* try next */ }
  }
  return null;
}
