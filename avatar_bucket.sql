-- 头像存储权限策略
-- 在 Supabase SQL Editor 中运行

-- 公开读取（任何人都能看头像）
CREATE POLICY "public read avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- 登录用户可上传
CREATE POLICY "user insert avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- 登录用户可更新自己的头像
CREATE POLICY "user update avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
