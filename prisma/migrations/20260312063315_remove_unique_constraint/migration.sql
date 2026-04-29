/*
  Warnings:- You are about to drop the `daily_employees` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "daily_employees" DROP CONSTRAINT "daily_employees_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "daily_employees" DROP CONSTRAINT "daily_employees_managerId_fkey";

-- DropTable
DROP TABLE "daily_employees";
