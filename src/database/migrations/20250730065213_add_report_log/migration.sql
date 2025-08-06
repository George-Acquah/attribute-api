-- CreateTable
CREATE TABLE "report_logs" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "file_path" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,

    CONSTRAINT "report_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "report_logs" ADD CONSTRAINT "report_logs_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
