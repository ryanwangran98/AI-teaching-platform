-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_knowledge_points" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "order" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "importance" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "chapterId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "knowledge_points_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_knowledge_points" ("chapterId", "content", "createdAt", "description", "id", "order", "title", "updatedAt") SELECT "chapterId", "content", "createdAt", "description", "id", "order", "title", "updatedAt" FROM "knowledge_points";
DROP TABLE "knowledge_points";
ALTER TABLE "new_knowledge_points" RENAME TO "knowledge_points";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
