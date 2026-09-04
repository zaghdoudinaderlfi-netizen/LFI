-- CreateTable
CREATE TABLE "CompteRendu" (
    "id" TEXT NOT NULL,
    "coursId" TEXT NOT NULL,
    "noms" TEXT NOT NULL,
    "dateDepot" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompteRendu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompteRendu_coursId_idx" ON "CompteRendu"("coursId");

-- AddForeignKey
ALTER TABLE "CompteRendu" ADD CONSTRAINT "CompteRendu_coursId_fkey" FOREIGN KEY ("coursId") REFERENCES "Cours"("id") ON DELETE CASCADE ON UPDATE CASCADE;
