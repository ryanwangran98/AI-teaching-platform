-- 首先将所有课程的department字段设置为NULL
UPDATE courses SET department = NULL;

-- 删除department字段
ALTER TABLE courses DROP COLUMN department;

-- 添加tags字段
ALTER TABLE courses ADD COLUMN "tags" TEXT;