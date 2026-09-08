-- CreateTable
CREATE TABLE "MainLevee" (
    "id" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "classeId" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MainLevee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MainLevee_eleveId_key" ON "MainLevee"("eleveId");

-- CreateIndex
CREATE INDEX "MainLevee_actif_idx" ON "MainLevee"("actif");

-- AddForeignKey
ALTER TABLE "MainLevee" ADD CONSTRAINT "MainLevee_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MainLevee" ADD CONSTRAINT "MainLevee_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE SET NULL ON UPDATE CASCADE;
