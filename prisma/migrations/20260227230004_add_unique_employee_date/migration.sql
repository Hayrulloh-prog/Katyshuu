/*
  Warnings:- A unique constraint covering the columns `[employeeId,date]` on the table `attendance_logs` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "qr_tokens" ALTER COLUMN "type" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "attendance_logs_employeeId_date_key" ON "attendance_logs"("employeeId", "date");
