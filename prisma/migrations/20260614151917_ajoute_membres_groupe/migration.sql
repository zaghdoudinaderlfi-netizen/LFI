-- CreateTable
CREATE TABLE "MembreGroupe" (
    "id" TEXT NOT NULL,
    "soumissionId" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MembreGroupe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MembreGroupe_eleveId_idx" ON "MembreGroupe"("eleveId");

-- CreateIndex
CREATE UNIQUE INDEX "MembreGroupe_soumissionId_eleveId_key" ON "MembreGroupe"("soumissionId", "eleveId");

-- AddForeignKey
ALTER TABLE "MembreGroupe" ADD CONSTRAINT "MembreGroupe_soumissionId_fkey" FOREIGN KEY ("soumissionId") REFERENCES "Soumission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembreGroupe" ADD CONSTRAINT "MembreGroupe_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
