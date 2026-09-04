-- AlterTable
ALTER TABLE "CompteRendu" ADD COLUMN     "classeId" TEXT;

-- CreateIndex
CREATE INDEX "CompteRendu_classeId_idx" ON "CompteRendu"("classeId");

-- AddForeignKey
ALTER TABLE "CompteRendu" ADD CONSTRAINT "CompteRendu_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE SET NULL ON UPDATE CASCADE;
