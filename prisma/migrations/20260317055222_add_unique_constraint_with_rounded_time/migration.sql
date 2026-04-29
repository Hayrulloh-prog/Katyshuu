/*
  Warnings:- A unique constraint covering the columns `[employeeId,date,checkInTime]` on the table `attendance_logs` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "attendance_logs_employeeId_date_checkInTime_key" ON "attendance_logs"("employeeId", "date", "checkInTime");
