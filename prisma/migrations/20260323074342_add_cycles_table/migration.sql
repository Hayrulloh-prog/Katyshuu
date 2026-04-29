-- CreateTable
CREATE TABLE "cycles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "managerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,  CONSTRAINT "cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CycleToEmployee" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "cycles_name_key" ON "cycles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_CycleToEmployee_AB_unique" ON "_CycleToEmployee"("A", "B");

-- CreateIndex
CREATE INDEX "_CycleToEmployee_B_index" ON "_CycleToEmployee"("B");

-- AddForeignKey
ALTER TABLE "cycles" ADD CONSTRAINT "cycles_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "managers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CycleToEmployee" ADD CONSTRAINT "_CycleToEmployee_A_fkey" FOREIGN KEY ("A") REFERENCES "cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CycleToEmployee" ADD CONSTRAINT "_CycleToEmployee_B_fkey" FOREIGN KEY ("B") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
