/*
  Warnings:

  - You are about to drop the column `channel` on the `campaigns` table. All the data in the column will be lost.
  - You are about to drop the column `descrpition` on the `campaigns` table. All the data in the column will be lost.
  - Added the required column `channelId` to the `campaigns` table without a default value. This is not possible if the table is not empty.
  - Added the required column `regionId` to the `campaigns` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "campaigns" DROP COLUMN "channel",
DROP COLUMN "descrpition",
ADD COLUMN     "channelId" TEXT NOT NULL,
ADD COLUMN     "description" TEXT DEFAULT '',
ADD COLUMN     "regionId" TEXT NOT NULL,
ADD COLUMN     "start_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "channels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geo_lifts" (
    "id" TEXT NOT NULL,
    "upliftPct" DOUBLE PRECISION NOT NULL,
    "keyDriver" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,

    CONSTRAINT "geo_lifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funnel_steps" (
    "id" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "campaignId" TEXT NOT NULL,

    CONSTRAINT "funnel_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "channels_name_key" ON "channels"("name");

-- CreateIndex
CREATE UNIQUE INDEX "countries_name_key" ON "countries"("name");

-- CreateIndex
CREATE UNIQUE INDEX "countries_code_key" ON "countries"("code");

-- CreateIndex
CREATE INDEX "regions_countryId_idx" ON "regions"("countryId");

-- CreateIndex
CREATE UNIQUE INDEX "regions_name_countryId_key" ON "regions"("name", "countryId");

-- CreateIndex
CREATE INDEX "geo_lifts_campaignId_regionId_idx" ON "geo_lifts"("campaignId", "regionId");

-- CreateIndex
CREATE UNIQUE INDEX "geo_lifts_campaignId_regionId_key" ON "geo_lifts"("campaignId", "regionId");

-- CreateIndex
CREATE INDEX "funnel_steps_campaignId_idx" ON "funnel_steps"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "funnel_steps_campaignId_order_key" ON "funnel_steps"("campaignId", "order");

-- CreateIndex
CREATE INDEX "campaigns_channelId_ownerId_regionId_idx" ON "campaigns"("channelId", "ownerId", "regionId");

-- CreateIndex
CREATE INDEX "codes_campaignId_idx" ON "codes"("campaignId");

-- CreateIndex
CREATE INDEX "conversion_interactions_interactionId_idx" ON "conversion_interactions"("interactionId");

-- CreateIndex
CREATE INDEX "conversions_userId_timestamp_idx" ON "conversions"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "conversions_fingerprint_idx" ON "conversions"("fingerprint");

-- CreateIndex
CREATE INDEX "interactions_userId_codeId_timestamp_idx" ON "interactions"("userId", "codeId", "timestamp");

-- CreateIndex
CREATE INDEX "interactions_fingerprint_idx" ON "interactions"("fingerprint");

-- CreateIndex
CREATE INDEX "users_phone_number_idx" ON "users"("phone_number");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regions" ADD CONSTRAINT "regions_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_lifts" ADD CONSTRAINT "geo_lifts_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_lifts" ADD CONSTRAINT "geo_lifts_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funnel_steps" ADD CONSTRAINT "funnel_steps_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
