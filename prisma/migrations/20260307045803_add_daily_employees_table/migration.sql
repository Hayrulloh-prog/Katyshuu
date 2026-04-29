-- CreateTable
CREATE TABLE "daily_employees" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "firstCheckIn" TIMESTAMP(3),
    "lastCheckOut" TIMESTAMP(3),
    "totalCycles" INTEGER NOT NULL DEFAULT 0,
    "managerId" INTEGER NOT NULL,  CONSTRAINT "daily_employees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_employees_employeeId_date_key" ON "daily_employees"("employeeId", "date");

-- AddForeignKey
ALTER TABLE "daily_employees" ADD CONSTRAINT "daily_employees_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_employees" ADD CONSTRAINT "daily_employees_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "managers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
