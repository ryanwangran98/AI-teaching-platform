-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_courses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "credits" INTEGER NOT NULL DEFAULT 3,
    "department" TEXT NOT NULL,
    "category" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
    "coverImage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "teacherId" TEXT NOT NULL,
    "agentAppId" TEXT,
    "agentAccessToken" TEXT,
    "agentAccessCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "courses_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_courses" ("agentAccessCode", "agentAccessToken", "agentAppId", "category", "code", "coverImage", "createdAt", "credits", "department", "description", "difficulty", "id", "name", "status", "teacherId", "updatedAt") SELECT "agentAccessCode", "agentAccessToken", "agentAppId", "category", "code", "coverImage", "createdAt", "credits", "department", "description", "difficulty", "id", "name", "status", "teacherId", "updatedAt" FROM "courses";
DROP TABLE "courses";
ALTER TABLE "new_courses" RENAME TO "courses";
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
