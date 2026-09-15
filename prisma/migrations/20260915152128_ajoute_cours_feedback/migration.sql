-- CreateEnum
CREATE TYPE "AvisFeedback" AS ENUM ('POSITIF', 'NEGATIF');

-- CreateTable
CREATE TABLE "CoursFeedback" (
    "id" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "coursId" TEXT NOT NULL,
    "avis" "AvisFeedback" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoursFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoursFeedback_coursId_idx" ON "CoursFeedback"("coursId");

-- CreateIndex
CREATE UNIQUE INDEX "CoursFeedback_eleveId_coursId_key" ON "CoursFeedback"("eleveId", "coursId");

-- AddForeignKey
ALTER TABLE "CoursFeedback" ADD CONSTRAINT "CoursFeedback_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursFeedback" ADD CONSTRAINT "CoursFeedback_coursId_fkey" FOREIGN KEY ("coursId") REFERENCES "Cours"("id") ON DELETE CASCADE ON UPDATE CASCADE;
