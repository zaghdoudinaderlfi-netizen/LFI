-- CreateEnum
CREATE TYPE "TypeBloc" AS ENUM ('TEXTE', 'IMAGE', 'PDF', 'VIDEO', 'ACTIVITE', 'LIEN');

-- CreateTable
CREATE TABLE "Bloc" (
    "id" TEXT NOT NULL,
    "coursId" TEXT NOT NULL,
    "type" "TypeBloc" NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "contenu" TEXT,
    "titre" TEXT,
    "outil" TEXT,
    "fichierNom" TEXT,
    "fichierChemin" TEXT,
    "fichierTaille" INTEGER,
    "fichierTypeMime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bloc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Logiciel" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "lien" TEXT,
    "fichierNom" TEXT,
    "fichierChemin" TEXT,
    "fichierTaille" INTEGER,
    "fichierTypeMime" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Logiciel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Bloc_coursId_idx" ON "Bloc"("coursId");

-- AddForeignKey
ALTER TABLE "Bloc" ADD CONSTRAINT "Bloc_coursId_fkey" FOREIGN KEY ("coursId") REFERENCES "Cours"("id") ON DELETE CASCADE ON UPDATE CASCADE;
