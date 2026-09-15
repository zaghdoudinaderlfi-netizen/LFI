-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL,
ADD COLUMN     "identifiant" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_identifiant_key" ON "User"("identifiant");
