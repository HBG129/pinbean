-- PinBean 数据库初始化
-- 在 Supabase Dashboard → SQL Editor 中粘贴运行

-- 1. 作品表
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT '未命名作品',
  grid JSONB NOT NULL DEFAULT '{}',
  thumbnail TEXT,
  is_public BOOLEAN DEFAULT false,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  bookmarks_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_projects_public ON projects(is_public, created_at DESC);
CREATE INDEX idx_projects_likes ON projects(likes_count DESC);
CREATE INDEX idx_projects_comments ON projects(comments_count DESC);
CREATE INDEX idx_projects_bookmarks ON projects(bookmarks_count DESC);

-- 2. 点赞表
CREATE TABLE likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- 3. 评论表
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_comments_project ON comments(project_id, created_at);

-- 4. 收藏表
CREATE TABLE bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- 5. RPC：增量/减量计数
CREATE OR REPLACE FUNCTION increment_likes(project_id UUID)
RETURNS void AS $$
BEGIN UPDATE projects SET likes_count = likes_count + 1, updated_at = NOW() WHERE id = project_id; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_likes(project_id UUID)
RETURNS void AS $$
BEGIN UPDATE projects SET likes_count = GREATEST(likes_count - 1, 0), updated_at = NOW() WHERE id = project_id; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_comments(project_id UUID)
RETURNS void AS $$
BEGIN UPDATE projects SET comments_count = comments_count + 1, updated_at = NOW() WHERE id = project_id; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_bookmarks(project_id UUID)
RETURNS void AS $$
BEGIN UPDATE projects SET bookmarks_count = bookmarks_count + 1, updated_at = NOW() WHERE id = project_id; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_bookmarks(project_id UUID)
RETURNS void AS $$
BEGIN UPDATE projects SET bookmarks_count = GREATEST(bookmarks_count - 1, 0), updated_at = NOW() WHERE id = project_id; END;
$$ LANGUAGE plpgsql;

-- 6. RLS 策略
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- 公开作品任何人可读
CREATE POLICY "public read" ON projects FOR SELECT USING (is_public = true);
-- 自己的作品可读
CREATE POLICY "owner read" ON projects FOR SELECT USING (auth.uid() = user_id);
-- 自己的作品可写
CREATE POLICY "owner insert" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner update" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "owner delete" ON projects FOR DELETE USING (auth.uid() = user_id);

-- likes / bookmarks RLS
CREATE POLICY "owner manage likes" ON likes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "owner manage bookmarks" ON bookmarks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "anyone comment" ON comments FOR SELECT USING (true);
CREATE POLICY "owner insert comment" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
