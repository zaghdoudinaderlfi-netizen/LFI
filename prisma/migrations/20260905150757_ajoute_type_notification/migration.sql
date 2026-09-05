
-- CreateEnum
CREATE TYPE "TypeNotification" AS ENUM ('GENERALE', 'NOTE');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "type" "TypeNotification" NOT NULL DEFAULT 'GENERALE';

