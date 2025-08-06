/*
  Warnings:

  - Added the required column `fingerprint` to the `conversions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "conversions" ADD COLUMN     "fingerprint" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "interactions" ADD COLUMN     "userMetadata" JSONB,
ALTER COLUMN "email" SET DATA TYPE TEXT;
