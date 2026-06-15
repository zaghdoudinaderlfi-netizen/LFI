-- CreateEnum
CREATE TYPE "ModeRemiseFormulaire" AS ENUM ('EN_LIGNE', 'TELECHARGEMENT');

-- AlterTable
ALTER TABLE "Exercice" ADD COLUMN     "modeRemise" "ModeRemiseFormulaire" NOT NULL DEFAULT 'EN_LIGNE';
