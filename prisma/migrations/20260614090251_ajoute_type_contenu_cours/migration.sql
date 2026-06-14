-- CreateEnum
CREATE TYPE "TypeContenuCours" AS ENUM ('HTML', 'PDF');

-- AlterTable
ALTER TABLE "Cours" ADD COLUMN     "pdfChemin" TEXT,
ADD COLUMN     "pdfNom" TEXT,
ADD COLUMN     "pdfTaille" INTEGER,
ADD COLUMN     "pdfTypeMime" TEXT,
ADD COLUMN     "typeContenu" "TypeContenuCours" NOT NULL DEFAULT 'HTML';
