import { prisma } from "./prisma";

export class ProgressionError extends Error {}

const TAILLE_MAX_CODE = 100_000;

/**
 * Sauvegarde (upsert) le code tapé par un élève dans une cellule d'exercice.
 * `exerciceId` est l'id HTML du conteneur de l'exercice (ex: "ex1"), fourni
 * par le script injecté côté page — voir injecterScriptProgression.
 */
export async function sauvegarderProgression({
  eleveId,
  coursId,
  exerciceId,
  code,
}: {
  eleveId: string;
  coursId: string;
  exerciceId: string;
  code: string;
}) {
  if (!exerciceId.trim()) {
    throw new ProgressionError("Exercice invalide.");
  }
  if (code.length > TAILLE_MAX_CODE) {
    throw new ProgressionError("Le code dépasse la taille maximale autorisée.");
  }

  return prisma.progressionExercice.upsert({
    where: { eleveId_coursId_exerciceId: { eleveId, coursId, exerciceId } },
    create: { eleveId, coursId, exerciceId, codeSauvegarde: code },
    update: { codeSauvegarde: code },
  });
}
