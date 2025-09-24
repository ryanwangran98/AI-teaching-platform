/*
  Warnings:

  - Added the required column `order` to the `chapters` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "courses" ADD COLUMN "agentAccessToken" TEXT;
ALTER TABLE "courses" ADD COLUMN "agentAppId" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
INSERT INTO "new_chapters" ("content", "courseId", "createdAt", "duration", "id", "status", "title", "updatedAt", "videoUrl", "order") SELECT "content", "courseId", "createdAt", "duration", "id", "status", "title", "updatedAt", "videoUrl", 0 FROM "chapters";
DROP TABLE "chapters";
ALTER TABLE "new_chapters" RENAME TO "chapters";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
