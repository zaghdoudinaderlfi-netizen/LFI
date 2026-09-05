-- CreateEnum
CREATE TYPE "Trimestre" AS ENUM ('T1', 'T2', 'T3');

-- CreateTable
CREATE TABLE "EntreeSuivi" (
    "id" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "classeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "travailFait" INTEGER NOT NULL,
    "compteRendu" INTEGER NOT NULL,
    "assiduite" INTEGER NOT NULL,
    "commentaire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntreeSuivi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EntreeSuivi_eleveId_idx" ON "EntreeSuivi"("eleveId");

-- CreateIndex
CREATE INDEX "EntreeSuivi_classeId_idx" ON "EntreeSuivi"("classeId");

-- AddForeignKey
ALTER TABLE "EntreeSuivi" ADD CONSTRAINT "EntreeSuivi_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntreeSuivi" ADD CONSTRAINT "EntreeSuivi_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
