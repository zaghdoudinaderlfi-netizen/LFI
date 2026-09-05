-- AlterTable
ALTER TABLE "CompteRendu" ADD COLUMN     "eleveId" TEXT,
ADD COLUMN     "noteEtoiles" INTEGER;

-- AlterTable
ALTER TABLE "EntreeSuivi" DROP COLUMN "compteRendu";

-- CreateTable
CREATE TABLE "MembreCompteRendu" (
    "id" TEXT NOT NULL,
    "compteRenduId" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MembreCompteRendu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MembreCompteRendu_eleveId_idx" ON "MembreCompteRendu"("eleveId");

-- CreateIndex
CREATE UNIQUE INDEX "MembreCompteRendu_compteRenduId_eleveId_key" ON "MembreCompteRendu"("compteRenduId", "eleveId");

-- CreateIndex
CREATE INDEX "CompteRendu_eleveId_idx" ON "CompteRendu"("eleveId");

-- AddForeignKey
ALTER TABLE "CompteRendu" ADD CONSTRAINT "CompteRendu_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembreCompteRendu" ADD CONSTRAINT "MembreCompteRendu_compteRenduId_fkey" FOREIGN KEY ("compteRenduId") REFERENCES "CompteRendu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembreCompteRendu" ADD CONSTRAINT "MembreCompteRendu_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

