-- 修复评论表：添加 parent_id 列（支持回复/嵌套评论）
-- 在 Supabase SQL Editor 中运行

ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;

-- 确认列已添加
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'comments';
