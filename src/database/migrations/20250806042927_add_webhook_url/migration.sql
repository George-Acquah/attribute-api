-- DropIndex
DROP INDEX "campaigns_channelId_ownerId_regionId_idx";

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "webhookUrl" TEXT;

-- AlterTable
ALTER TABLE "report_logs" ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "campaigns_channelId_ownerId_regionId_created_at_idx" ON "campaigns"("channelId", "ownerId", "regionId", "created_at");
