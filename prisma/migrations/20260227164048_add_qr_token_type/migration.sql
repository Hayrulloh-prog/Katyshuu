-- DropForeignKey
ALTER TABLE "qr_tokens" DROP CONSTRAINT "qr_tokens_managerId_fkey";

-- AlterTable
ALTER TABLE "qr_tokens" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'EMPLOYEE_REG',
ALTER COLUMN "managerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "qr_tokens" ADD CONSTRAINT "qr_tokens_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "managers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
