-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "actions" TEXT[] DEFAULT ARRAY['SIGNUP', 'PURCHASE', 'DOWNLOAD']::TEXT[],
ADD COLUMN     "budget" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "descrpition" TEXT DEFAULT '',
ADD COLUMN     "end_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "target" JSONB;

-- AlterTable
ALTER TABLE "interactions" ADD COLUMN     "email" JSONB,
ADD COLUMN     "phoneNumber" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone_number" TEXT,
ALTER COLUMN "email" DROP NOT NULL;
