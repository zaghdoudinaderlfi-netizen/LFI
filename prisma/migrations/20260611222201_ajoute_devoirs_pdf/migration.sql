-- AlterEnum
ALTER TYPE "TypeExercice" ADD VALUE 'DEVOIR_PDF';

-- AlterTable
ALTER TABLE "Exercice" ADD COLUMN     "dateLimite" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Soumission" ADD COLUMN     "fichierChemin" TEXT,
ADD COLUMN     "fichierNom" TEXT,
ADD COLUMN     "fichierTaille" INTEGER,
ADD COLUMN     "fichierTypeMime" TEXT,
ALTER COLUMN "contenu" DROP NOT NULL;
