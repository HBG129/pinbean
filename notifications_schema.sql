-- 通知系统
-- 在 Supabase SQL Editor 中运行

-- 1. 通知表
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,         -- 'like' | 'comment' | 'reply'
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_user_unread ON notifications(user_id, read, created_at DESC);

-- 2. 触发器：点赞时通知
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, actor_id, type, project_id)
  SELECT p.user_id, NEW.user_id, 'like', NEW.project_id
  FROM projects p WHERE p.id = NEW.project_id AND p.user_id != NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_like ON likes;
CREATE TRIGGER trg_notify_like AFTER INSERT ON likes
FOR EACH ROW EXECUTE FUNCTION notify_on_like();

-- 3. 触发器：评论时通知
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, actor_id, type, project_id)
  SELECT p.user_id, NEW.user_id,
    CASE WHEN NEW.parent_id IS NOT NULL THEN 'reply' ELSE 'comment' END,
    NEW.project_id
  FROM projects p WHERE p.id = NEW.project_id AND p.user_id != NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_comment ON comments;
CREATE TRIGGER trg_notify_comment AFTER INSERT ON comments
FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

-- 4. 安全策略
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manage notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);
