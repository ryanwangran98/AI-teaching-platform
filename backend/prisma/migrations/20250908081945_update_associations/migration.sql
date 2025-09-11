/*
  Warnings:

  - You are about to drop the column `courseId` on the `assignments` table. All the data in the column will be lost.
  - You are about to drop the column `knowledgePointId` on the `coursewares` table. All the data in the column will be lost.
  - You are about to drop the column `courseId` on the `materials` table. All the data in the column will be lost.
  - You are about to drop the column `chapterId` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `courseId` on the `questions` table. All the data in the column will be lost.
  - Added the required column `knowledgePointId` to the `assignments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `chapterId` to the `coursewares` table without a default value. This is not possible if the table is not empty.
  - Added the required column `chapterId` to the `materials` table without a default value. This is not possible if the table is not empty.
  - Made the column `knowledgePointId` on table `questions` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'HOMEWORK',
    "totalPoints" INTEGER NOT NULL DEFAULT 100,
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "knowledgePointId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "assignments_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "assignments_knowledgePointId_fkey" FOREIGN KEY ("knowledgePointId") REFERENCES "knowledge_points" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_assignments" ("createdAt", "description", "dueDate", "id", "status", "teacherId", "title", "totalPoints", "type", "updatedAt") SELECT "createdAt", "description", "dueDate", "id", "status", "teacherId", "title", "totalPoints", "type", "updatedAt" FROM "assignments";
DROP TABLE "assignments";
ALTER TABLE "new_assignments" RENAME TO "assignments";
CREATE TABLE "new_coursewares" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'SLIDES',
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "chapterId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "coursewares_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "coursewares_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_coursewares" ("createdAt", "description", "fileSize", "fileUrl", "id", "title", "type", "updatedAt", "uploadedById") SELECT "createdAt", "description", "fileSize", "fileUrl", "id", "title", "type", "updatedAt", "uploadedById" FROM "coursewares";
DROP TABLE "coursewares";
ALTER TABLE "new_coursewares" RENAME TO "coursewares";
CREATE TABLE "new_materials" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'DOCUMENT',
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "chapterId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "materials_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "materials_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_materials" ("createdAt", "description", "fileSize", "fileUrl", "id", "title", "type", "updatedAt", "uploadedById") SELECT "createdAt", "description", "fileSize", "fileUrl", "id", "title", "type", "updatedAt", "uploadedById" FROM "materials";
DROP TABLE "materials";
ALTER TABLE "new_materials" RENAME TO "materials";
CREATE TABLE "new_questions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SINGLE_CHOICE',
    "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
    "points" INTEGER NOT NULL DEFAULT 1,
    "options" TEXT,
    "correctAnswer" TEXT,
    "explanation" TEXT,
    "knowledgePointId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "teacherId" TEXT NOT NULL,
    CONSTRAINT "questions_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "questions_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "questions_knowledgePointId_fkey" FOREIGN KEY ("knowledgePointId") REFERENCES "knowledge_points" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_questions" ("assignmentId", "content", "correctAnswer", "createdAt", "difficulty", "explanation", "id", "knowledgePointId", "options", "points", "teacherId", "title", "type", "updatedAt") SELECT "assignmentId", "content", "correctAnswer", "createdAt", "difficulty", "explanation", "id", "knowledgePointId", "options", "points", "teacherId", "title", "type", "updatedAt" FROM "questions";
DROP TABLE "questions";
ALTER TABLE "new_questions" RENAME TO "questions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
