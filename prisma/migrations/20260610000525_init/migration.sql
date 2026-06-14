-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PROF', 'ELEVE');

-- CreateEnum
CREATE TYPE "Niveau" AS ENUM ('TROISIEME', 'SECONDE');

-- CreateEnum
CREATE TYPE "Matiere" AS ENUM ('TECHNOLOGIE', 'SNT');

-- CreateEnum
CREATE TYPE "TypeExercice" AS ENUM ('PYTHON', 'TURTLE', 'QCM', 'ARDUINO', 'CODE_OUVERT');

-- CreateEnum
CREATE TYPE "TypeQuestion" AS ENUM ('CHOIX_UNIQUE', 'CHOIX_MULTIPLE', 'VRAI_FAUX');

-- CreateEnum
CREATE TYPE "StatutPartie" AS ENUM ('EN_ATTENTE', 'EN_COURS', 'TERMINEE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ELEVE',
    "classeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Classe" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "niveau" "Niveau" NOT NULL,
    "codeInscription" TEXT NOT NULL,
    "anneeScolaire" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Classe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cours" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "niveau" "Niveau" NOT NULL,
    "matiere" "Matiere" NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "publie" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercice" (
    "id" TEXT NOT NULL,
    "coursId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "consigne" TEXT NOT NULL,
    "type" "TypeExercice" NOT NULL,
    "codeDepart" TEXT,
    "sortieAttendue" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Exercice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Soumission" (
    "id" TEXT NOT NULL,
    "exerciceId" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "reussi" BOOLEAN NOT NULL DEFAULT false,
    "note" DOUBLE PRECISION,
    "feedback" TEXT,
    "corrigeManuellement" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Soumission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Progression" (
    "id" TEXT NOT NULL,
    "niveau" "Niveau" NOT NULL,
    "matiere" "Matiere" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Progression_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "niveau" "Niveau",
    "matiere" "Matiere",
    "publie" BOOLEAN NOT NULL DEFAULT false,
    "auteurId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionQuiz" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "enonce" TEXT NOT NULL,
    "type" "TypeQuestion" NOT NULL DEFAULT 'CHOIX_UNIQUE',
    "imageUrl" TEXT,
    "tempsLimiteSec" INTEGER NOT NULL DEFAULT 20,
    "points" INTEGER NOT NULL DEFAULT 1000,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuestionQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChoixQuiz" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "texte" TEXT NOT NULL,
    "estCorrect" BOOLEAN NOT NULL DEFAULT false,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ChoixQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartieQuiz" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "codePin" TEXT NOT NULL,
    "statut" "StatutPartie" NOT NULL DEFAULT 'EN_ATTENTE',
    "hoteId" TEXT NOT NULL,
    "classeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "termineeA" TIMESTAMP(3),

    CONSTRAINT "PartieQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipantPartie" (
    "id" TEXT NOT NULL,
    "partieId" TEXT NOT NULL,
    "eleveId" TEXT,
    "pseudo" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "rang" INTEGER,

    CONSTRAINT "ParticipantPartie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReponseQuiz" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "choixId" TEXT,
    "correct" BOOLEAN NOT NULL DEFAULT false,
    "tempsMs" INTEGER NOT NULL,
    "pointsObtenus" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ReponseQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Classe_codeInscription_key" ON "Classe"("codeInscription");

-- CreateIndex
CREATE UNIQUE INDEX "Cours_slug_key" ON "Cours"("slug");

-- CreateIndex
CREATE INDEX "Soumission_eleveId_idx" ON "Soumission"("eleveId");

-- CreateIndex
CREATE INDEX "Soumission_exerciceId_idx" ON "Soumission"("exerciceId");

-- CreateIndex
CREATE UNIQUE INDEX "PartieQuiz_codePin_key" ON "PartieQuiz"("codePin");

-- CreateIndex
CREATE INDEX "ParticipantPartie_partieId_idx" ON "ParticipantPartie"("partieId");

-- CreateIndex
CREATE INDEX "ReponseQuiz_participantId_idx" ON "ReponseQuiz"("participantId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercice" ADD CONSTRAINT "Exercice_coursId_fkey" FOREIGN KEY ("coursId") REFERENCES "Cours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Soumission" ADD CONSTRAINT "Soumission_exerciceId_fkey" FOREIGN KEY ("exerciceId") REFERENCES "Exercice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Soumission" ADD CONSTRAINT "Soumission_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionQuiz" ADD CONSTRAINT "QuestionQuiz_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoixQuiz" ADD CONSTRAINT "ChoixQuiz_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuestionQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartieQuiz" ADD CONSTRAINT "PartieQuiz_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartieQuiz" ADD CONSTRAINT "PartieQuiz_hoteId_fkey" FOREIGN KEY ("hoteId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartieQuiz" ADD CONSTRAINT "PartieQuiz_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantPartie" ADD CONSTRAINT "ParticipantPartie_partieId_fkey" FOREIGN KEY ("partieId") REFERENCES "PartieQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantPartie" ADD CONSTRAINT "ParticipantPartie_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReponseQuiz" ADD CONSTRAINT "ReponseQuiz_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "ParticipantPartie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReponseQuiz" ADD CONSTRAINT "ReponseQuiz_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuestionQuiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReponseQuiz" ADD CONSTRAINT "ReponseQuiz_choixId_fkey" FOREIGN KEY ("choixId") REFERENCES "ChoixQuiz"("id") ON DELETE SET NULL ON UPDATE CASCADE;
