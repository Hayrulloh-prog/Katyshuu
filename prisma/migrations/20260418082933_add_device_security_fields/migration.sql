-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "deviceModel" TEXT;

-- AlterTable
ALTER TABLE "managers" ADD COLUMN     "strictDeviceCheck" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "attendance_logs_employeeId_date_idx" ON "attendance_logs"("employeeId", "date");
