/*
  Warnings:

  - You are about to drop the column `description` on the `chapters` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `chapters` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_chapters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "courseId" TEXT NOT NULL,
    "videoUrl" TEXT,
    "duration" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "chapters_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_chapters" ("content", "courseId", "createdAt", "duration", "id", "status", "title", "updatedAt", "videoUrl") SELECT "content", "courseId", "createdAt", "duration", "id", "status", "title", "updatedAt", "videoUrl" FROM "chapters";
DROP TABLE "chapters";
ALTER TABLE "new_chapters" RENAME TO "chapters";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
