-- CreateEnum
CREATE TYPE "TypeCoursSimple" AS ENUM ('HTML', 'PDF', 'WORD', 'VIDEO', 'QCM');

-- AlterTable
ALTER TABLE "Cours" ADD COLUMN     "fichierUrl" TEXT,
ADD COLUMN     "quizId" TEXT,
ADD COLUMN     "typeSimple" "TypeCoursSimple",
ADD COLUMN     "videoUrl" TEXT;

-- CreateIndex
CREATE INDEX "Cours_quizId_idx" ON "Cours"("quizId");

-- AddForeignKey
ALTER TABLE "Cours" ADD CONSTRAINT "Cours_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE SET NULL ON UPDATE CASCADE;
