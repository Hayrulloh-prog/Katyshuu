/*
  Warnings:- A unique constraint covering the columns `[managerId,email]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[managerId,phone]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[managerId,login]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[managerId,googleId]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[managerId,appleId]` on the table `employees` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "employees_appleId_key";

-- DropIndex
DROP INDEX "employees_email_key";

-- DropIndex
DROP INDEX "employees_googleId_key";

-- DropIndex
DROP INDEX "employees_login_key";

-- DropIndex
DROP INDEX "employees_phone_key";

-- CreateIndex
CREATE UNIQUE INDEX "employees_managerId_email_key" ON "employees"("managerId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "employees_managerId_phone_key" ON "employees"("managerId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "employees_managerId_login_key" ON "employees"("managerId", "login");

-- CreateIndex
CREATE UNIQUE INDEX "employees_managerId_googleId_key" ON "employees"("managerId", "googleId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_managerId_appleId_key" ON "employees"("managerId", "appleId");
