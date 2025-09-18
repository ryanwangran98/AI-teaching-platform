-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_coursewares" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'SLIDES',
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "chapterId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "coursewares_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "coursewares_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_coursewares" ("chapterId", "createdAt", "description", "fileSize", "fileUrl", "id", "title", "type", "updatedAt", "uploadedById") SELECT "chapterId", "createdAt", "description", "fileSize", "fileUrl", "id", "title", "type", "updatedAt", "uploadedById" FROM "coursewares";
DROP TABLE "coursewares";
ALTER TABLE "new_coursewares" RENAME TO "coursewares";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
