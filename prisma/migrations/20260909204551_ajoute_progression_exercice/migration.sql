-- CreateTable
CREATE TABLE "ProgressionExercice" (
    "id" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "coursId" TEXT NOT NULL,
    "exerciceId" TEXT NOT NULL,
    "codeSauvegarde" TEXT NOT NULL,
    "dateMaj" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressionExercice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgressionExercice_eleveId_coursId_exerciceId_key" ON "ProgressionExercice"("eleveId", "coursId", "exerciceId");

-- AddForeignKey
ALTER TABLE "ProgressionExercice" ADD CONSTRAINT "ProgressionExercice_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressionExercice" ADD CONSTRAINT "ProgressionExercice_coursId_fkey" FOREIGN KEY ("coursId") REFERENCES "Cours"("id") ON DELETE CASCADE ON UPDATE CASCADE;
