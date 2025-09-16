-- This is an empty migration.
CREATE TABLE "new_chapters" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "content" TEXT,
  "order" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "courseId" TEXT NOT NULL,
  "videoUrl" TEXT,
  "duration" REAL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "chapters_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Copy data from old table to new table
INSERT INTO "new_chapters" ("id", "title", "content", "order", "status", "courseId", "videoUrl", "duration", "createdAt", "updatedAt") 
SELECT "id", "title", "content", "order", "status", "courseId", "videoUrl", "duration", "createdAt", "updatedAt" FROM "chapters";

-- Drop old table
DROP TABLE "chapters";

-- Rename new table to old table name
ALTER TABLE "new_chapters" RENAME TO "chapters";