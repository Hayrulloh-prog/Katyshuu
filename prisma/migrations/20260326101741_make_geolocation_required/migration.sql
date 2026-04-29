/*
  Warnings:- Made the column `registrationLatitude` on table `managers` required. This step will fail if there are existing NULL values in that column.
  - Made the column `registrationLongitude` on table `managers` required. This step will fail if there are existing NULL values in that column.

*/

-- Update existing NULL values to default coordinates (Bishkek center)
UPDATE "managers"
SET "registrationLatitude" = 42.8746, "registrationLongitude" = 74.5698
WHERE "registrationLatitude" IS NULL OR "registrationLongitude" IS NULL;

-- AlterTable
ALTER TABLE "managers" ALTER COLUMN "registrationLatitude" SET NOT NULL,
ALTER COLUMN "registrationLongitude" SET NOT NULL;
