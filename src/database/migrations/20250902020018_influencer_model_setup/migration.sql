/*
  Warnings:

  - The `actions` column on the `campaigns` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "CampaignStatusType" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CodeType" AS ENUM ('QR', 'BARCODE', 'USSD', 'SMS', 'REFERRAL');

-- AlterTable
ALTER TABLE "blocked_fingerprints" ADD COLUMN     "blockedById" TEXT,
ADD COLUMN     "deleted_at" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "archived_at" TIMESTAMPTZ(6),
ADD COLUMN     "influencerId" TEXT,
ADD COLUMN     "status" "CampaignStatusType" NOT NULL DEFAULT 'DRAFT',
DROP COLUMN "actions",
ADD COLUMN     "actions" "ConversionType"[] DEFAULT ARRAY['SIGNUP', 'PURCHASE', 'DOWNLOAD']::"ConversionType"[];

-- AlterTable
ALTER TABLE "codes" ADD COLUMN     "type" "CodeType" NOT NULL DEFAULT 'QR';

-- AlterTable
ALTER TABLE "interactions" ADD COLUMN     "campaignName" TEXT,
ADD COLUMN     "device" TEXT,
ADD COLUMN     "funnelStepId" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "medium" TEXT,
ADD COLUMN     "referrer" TEXT,
ADD COLUMN     "source" TEXT;

-- CreateTable
CREATE TABLE "Influencer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "handle" TEXT,

    CONSTRAINT "Influencer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfluencerMetric" (
    "id" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL,
    "clicks" INTEGER NOT NULL,
    "engagement" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InfluencerMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Influencer_handle_key" ON "Influencer"("handle");

-- CreateIndex
CREATE INDEX "interactions_source_idx" ON "interactions"("source");

-- CreateIndex
CREATE INDEX "interactions_medium_idx" ON "interactions"("medium");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerMetric" ADD CONSTRAINT "InfluencerMetric_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerMetric" ADD CONSTRAINT "InfluencerMetric_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_funnelStepId_fkey" FOREIGN KEY ("funnelStepId") REFERENCES "funnel_steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocked_fingerprints" ADD CONSTRAINT "blocked_fingerprints_blockedById_fkey" FOREIGN KEY ("blockedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
