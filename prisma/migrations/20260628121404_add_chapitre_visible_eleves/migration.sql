-- AlterTable
ALTER TABLE "Cours" ADD COLUMN     "chapitre" INTEGER,
ADD COLUMN     "visibleEleves" BOOLEAN NOT NULL DEFAULT true;
