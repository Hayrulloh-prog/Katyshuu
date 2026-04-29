/*
  Warnings:- A unique constraint covering the columns `[email]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[googleId]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[appleId]` on the table `employees` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "appleId" TEXT,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "position" TEXT;

-- Update existing records with temporary email values
UPDATE "employees" SET "email" = login || '@temp.com' WHERE "email" IS NULL;

-- Make email column NOT NULL after updating existing records
ALTER TABLE "employees" ALTER COLUMN "email" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employees_googleId_key" ON "employees"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_appleId_key" ON "employees"("appleId");
