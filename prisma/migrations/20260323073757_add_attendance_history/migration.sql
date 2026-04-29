-- CreateTable
CREATE TABLE "attendance_history" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "checkInTime" TIMESTAMP(3) NOT NULL,
    "checkOutTime" TIMESTAMP(3),
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "location" TEXT,
    "deviceFingerprint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "originalRecordId" INTEGER,  CONSTRAINT "attendance_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "attendance_history" ADD CONSTRAINT "attendance_history_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_history" ADD CONSTRAINT "attendance_history_originalRecordId_fkey" FOREIGN KEY ("originalRecordId") REFERENCES "attendance_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
