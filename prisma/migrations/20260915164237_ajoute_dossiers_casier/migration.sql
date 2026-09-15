-- AlterTable
ALTER TABLE "DocumentCasier" ADD COLUMN     "dossierId" TEXT;

-- CreateTable
CREATE TABLE "DossierCasier" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "matiere" "Matiere" NOT NULL,
    "eleveId" TEXT,
    "auteurId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DossierCasier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DossierCasier_matiere_idx" ON "DossierCasier"("matiere");

-- CreateIndex
CREATE INDEX "DossierCasier_eleveId_idx" ON "DossierCasier"("eleveId");

-- CreateIndex
CREATE INDEX "DocumentCasier_dossierId_idx" ON "DocumentCasier"("dossierId");

-- AddForeignKey
ALTER TABLE "DocumentCasier" ADD CONSTRAINT "DocumentCasier_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "DossierCasier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierCasier" ADD CONSTRAINT "DossierCasier_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierCasier" ADD CONSTRAINT "DossierCasier_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
