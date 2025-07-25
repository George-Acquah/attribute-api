/*
  Warnings:

  - Changed the type of `type` on the `interactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('SCAN', 'PAGE_VIEW', 'SIGNUP', 'PURCHASE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ConversionType" AS ENUM ('SIGNUP', 'PURCHASE', 'DOWNLOAD', 'BOOKING', 'CUSTOM');

-- DropForeignKey
ALTER TABLE "interactions" DROP CONSTRAINT "interactions_userId_fkey";

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "channel" TEXT NOT NULL DEFAULT 'QR',
ADD COLUMN     "deleted_at" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "codes" ADD COLUMN     "deleted_at" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "interactions" ADD COLUMN     "fingerprint" TEXT,
ALTER COLUMN "userId" DROP NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "InteractionType" NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deleted_at" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "conversions" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" "ConversionType" NOT NULL,
    "value" DOUBLE PRECISION,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversion_interactions" (
    "conversionId" TEXT NOT NULL,
    "interactionId" TEXT NOT NULL,

    CONSTRAINT "conversion_interactions_pkey" PRIMARY KEY ("conversionId","interactionId")
);

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversion_interactions" ADD CONSTRAINT "conversion_interactions_conversionId_fkey" FOREIGN KEY ("conversionId") REFERENCES "conversions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversion_interactions" ADD CONSTRAINT "conversion_interactions_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "interactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
