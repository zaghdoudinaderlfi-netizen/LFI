-- AlterTable
ALTER TABLE "EntreeSuivi" ADD COLUMN     "comportement" INTEGER;

-- CreateTable
CREATE TABLE "Annonce" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "fichierNom" TEXT,
    "fichierChemin" TEXT,
    "fichierTaille" INTEGER,
    "fichierTypeMime" TEXT,
    "auteurId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Annonce_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Annonce_actif_idx" ON "Annonce"("actif");

-- AddForeignKey
ALTER TABLE "Annonce" ADD CONSTRAINT "Annonce_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
