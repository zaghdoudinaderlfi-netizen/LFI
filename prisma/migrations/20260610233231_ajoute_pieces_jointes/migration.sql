-- CreateTable
CREATE TABLE "PieceJointe" (
    "id" TEXT NOT NULL,
    "coursId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "chemin" TEXT NOT NULL,
    "taille" INTEGER NOT NULL,
    "typeMime" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PieceJointe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PieceJointe_coursId_idx" ON "PieceJointe"("coursId");

-- AddForeignKey
ALTER TABLE "PieceJointe" ADD CONSTRAINT "PieceJointe_coursId_fkey" FOREIGN KEY ("coursId") REFERENCES "Cours"("id") ON DELETE CASCADE ON UPDATE CASCADE;
