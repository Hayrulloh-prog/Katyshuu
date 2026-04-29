-- DropIndex
DROP INDEX "attendance_logs_employeeId_date_checkInTime_key";

-- AlterTable
ALTER TABLE "attendance_history" ADD COLUMN     "actualScannerName" TEXT,
ADD COLUMN     "isForeignDevice" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "attendance_logs" ADD COLUMN     "actualScannerName" TEXT,
ADD COLUMN     "isForeignDevice" BOOLEAN NOT NULL DEFAULT false;
