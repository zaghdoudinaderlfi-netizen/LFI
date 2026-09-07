-- AlterTable
ALTER TABLE "Exercice" ADD COLUMN     "examenDebut" TIMESTAMP(3),
ADD COLUMN     "examenFin" TIMESTAMP(3),
ADD COLUMN     "modeExamen" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "derniereActivite" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "VerrouExamen" (
    "id" TEXT NOT NULL,
    "exerciceId" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "verrouilleAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motif" TEXT,
    "debloqueAt" TIMESTAMP(3),
    "debloqueParId" TEXT,

    CONSTRAINT "VerrouExamen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VerrouExamen_eleveId_idx" ON "VerrouExamen"("eleveId");

-- CreateIndex
CREATE UNIQUE INDEX "VerrouExamen_exerciceId_eleveId_key" ON "VerrouExamen"("exerciceId", "eleveId");

-- AddForeignKey
ALTER TABLE "VerrouExamen" ADD CONSTRAINT "VerrouExamen_exerciceId_fkey" FOREIGN KEY ("exerciceId") REFERENCES "Exercice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerrouExamen" ADD CONSTRAINT "VerrouExamen_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
