/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `QuestionQuiz` table. All the data in the column will be lost.
  - You are about to drop the column `points` on the `QuestionQuiz` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `QuestionQuiz` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `publie` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the `ChoixQuiz` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ParticipantPartie` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PartieQuiz` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReponseQuiz` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `bonneReponse` to the `QuestionQuiz` table without a default value. This is not possible if the table is not empty.
  - Added the required column `choixA` to the `QuestionQuiz` table without a default value. This is not possible if the table is not empty.
  - Added the required column `choixB` to the `QuestionQuiz` table without a default value. This is not possible if the table is not empty.
  - Added the required column `choixC` to the `QuestionQuiz` table without a default value. This is not possible if the table is not empty.
  - Added the required column `choixD` to the `QuestionQuiz` table without a default value. This is not possible if the table is not empty.
  - Made the column `niveau` on table `Quiz` required. This step will fail if there are existing NULL values in that column.
  - Made the column `matiere` on table `Quiz` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ChoixQuiz" DROP CONSTRAINT "ChoixQuiz_questionId_fkey";

-- DropForeignKey
ALTER TABLE "ParticipantPartie" DROP CONSTRAINT "ParticipantPartie_eleveId_fkey";

-- DropForeignKey
ALTER TABLE "ParticipantPartie" DROP CONSTRAINT "ParticipantPartie_partieId_fkey";

-- DropForeignKey
ALTER TABLE "PartieQuiz" DROP CONSTRAINT "PartieQuiz_classeId_fkey";

-- DropForeignKey
ALTER TABLE "PartieQuiz" DROP CONSTRAINT "PartieQuiz_hoteId_fkey";

-- DropForeignKey
ALTER TABLE "PartieQuiz" DROP CONSTRAINT "PartieQuiz_quizId_fkey";

-- DropForeignKey
ALTER TABLE "ReponseQuiz" DROP CONSTRAINT "ReponseQuiz_choixId_fkey";

-- DropForeignKey
ALTER TABLE "ReponseQuiz" DROP CONSTRAINT "ReponseQuiz_participantId_fkey";

-- DropForeignKey
ALTER TABLE "ReponseQuiz" DROP CONSTRAINT "ReponseQuiz_questionId_fkey";

-- AlterTable
ALTER TABLE "QuestionQuiz" DROP COLUMN "imageUrl",
DROP COLUMN "points",
DROP COLUMN "type",
ADD COLUMN     "bonneReponse" INTEGER NOT NULL,
ADD COLUMN     "choixA" TEXT NOT NULL,
ADD COLUMN     "choixB" TEXT NOT NULL,
ADD COLUMN     "choixC" TEXT NOT NULL,
ADD COLUMN     "choixD" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Quiz" DROP COLUMN "description",
DROP COLUMN "publie",
ADD COLUMN     "chapitre" INTEGER,
ADD COLUMN     "visibleEleves" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "niveau" SET NOT NULL,
ALTER COLUMN "matiere" SET NOT NULL;

-- DropTable
DROP TABLE "ChoixQuiz";

-- DropTable
DROP TABLE "ParticipantPartie";

-- DropTable
DROP TABLE "PartieQuiz";

-- DropTable
DROP TABLE "ReponseQuiz";

-- DropEnum
DROP TYPE "StatutPartie";

-- DropEnum
DROP TYPE "TypeQuestion";

-- CreateTable
CREATE TABLE "TentativeQuiz" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "bonnesReponses" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TentativeQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReponseTentative" (
    "id" TEXT NOT NULL,
    "tentativeId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "reponseDonnee" INTEGER,
    "correct" BOOLEAN NOT NULL DEFAULT false,
    "tempsMs" INTEGER NOT NULL,
    "pointsObtenus" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ReponseTentative_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TentativeQuiz_quizId_idx" ON "TentativeQuiz"("quizId");

-- CreateIndex
CREATE INDEX "TentativeQuiz_eleveId_idx" ON "TentativeQuiz"("eleveId");

-- CreateIndex
CREATE INDEX "ReponseTentative_tentativeId_idx" ON "ReponseTentative"("tentativeId");

-- CreateIndex
CREATE INDEX "QuestionQuiz_quizId_idx" ON "QuestionQuiz"("quizId");

-- AddForeignKey
ALTER TABLE "TentativeQuiz" ADD CONSTRAINT "TentativeQuiz_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TentativeQuiz" ADD CONSTRAINT "TentativeQuiz_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReponseTentative" ADD CONSTRAINT "ReponseTentative_tentativeId_fkey" FOREIGN KEY ("tentativeId") REFERENCES "TentativeQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReponseTentative" ADD CONSTRAINT "ReponseTentative_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuestionQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
