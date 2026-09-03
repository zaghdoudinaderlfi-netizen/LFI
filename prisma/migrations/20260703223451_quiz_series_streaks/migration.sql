-- AlterTable
ALTER TABLE "ReponseTentative" ADD COLUMN     "multiplicateurSerie" DOUBLE PRECISION NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "TentativeQuiz" ADD COLUMN     "serieActuelle" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "serieMax" INTEGER NOT NULL DEFAULT 0;
