-- CreateTable
CREATE TABLE "DocumentCasier" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "chemin" TEXT NOT NULL,
    "taille" INTEGER NOT NULL,
    "typeMime" TEXT NOT NULL,
    "matiere" "Matiere" NOT NULL,
    "eleveId" TEXT,
    "auteurId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentCasier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentCasier_matiere_idx" ON "DocumentCasier"("matiere");

-- CreateIndex
CREATE INDEX "DocumentCasier_eleveId_idx" ON "DocumentCasier"("eleveId");

-- AddForeignKey
ALTER TABLE "DocumentCasier" ADD CONSTRAINT "DocumentCasier_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentCasier" ADD CONSTRAINT "DocumentCasier_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
