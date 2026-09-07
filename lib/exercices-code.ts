import { TypeExercice } from "@prisma/client";
import { prisma } from "./prisma";
import { notifierElevesDuNiveau } from "./notifications";
import { ExerciceCodeError, TYPES_EXERCICE_CODE, estTypeExerciceCode } from "./exercices-code-constants";

export * from "./exercices-code-constants";

type ExerciceCodeInput = {
  titre: string;
  consigne: string;
  type: TypeExercice;
  codeDepart?: string;
  sortieAttendue?: string;
  points: number;
  dateLimite?: Date | null;
  modeExamen?: boolean;
  examenDebut?: Date | null;
  examenFin?: Date | null;
};

function validerExerciceCodeInput({
  titre,
  consigne,
  type,
  points,
  sortieAttendue,
  modeExamen,
  examenDebut,
  examenFin,
}: ExerciceCodeInput) {
  if (!titre.trim()) {
    throw new ExerciceCodeError("Le titre est obligatoire.");
  }

  if (!consigne.trim()) {
    throw new ExerciceCodeError("La consigne est obligatoire.");
  }

  if (!Number.isFinite(points) || points <= 0) {
    throw new ExerciceCodeError("Le barème doit être un nombre positif.");
  }

  if (!estTypeExerciceCode(type)) {
    throw new ExerciceCodeError("Type d'exercice invalide.");
  }

  if (type === TypeExercice.PYTHON && !sortieAttendue?.trim()) {
    throw new ExerciceCodeError(
      "La sortie attendue est obligatoire pour un exercice Python (correction automatique)."
    );
  }

  if (modeExamen) {
    if (!examenDebut || !examenFin) {
      throw new ExerciceCodeError("Le mode examen exige une date de début et une date de fin.");
    }
    if (examenFin <= examenDebut) {
      throw new ExerciceCodeError("La fin de l'épreuve doit être après son début.");
    }
  }
}

export async function creerExerciceCode(coursId: string, data: ExerciceCodeInput) {
  validerExerciceCodeInput(data);

  const cours = await prisma.cours.findUnique({ where: { id: coursId } });
  if (!cours) {
    throw new ExerciceCodeError("Cours introuvable.");
  }

  const exercice = await prisma.exercice.create({
    data: {
      coursId,
      titre: data.titre.trim(),
      consigne: data.consigne.trim(),
      type: data.type,
      points: data.points,
      dateLimite: data.dateLimite ?? null,
      codeDepart: data.codeDepart?.trim() || null,
      sortieAttendue: data.type === TypeExercice.PYTHON ? data.sortieAttendue!.trim() : null,
      modeExamen: data.modeExamen ?? false,
      examenDebut: data.modeExamen ? data.examenDebut ?? null : null,
      examenFin: data.modeExamen ? data.examenFin ?? null : null,
    },
  });

  if (cours.publie) {
    await notifierElevesDuNiveau(
      cours.niveau,
      `Nouvel exercice de code : « ${exercice.titre} » (${cours.titre})`,
      `/eleve/cours/${cours.slug}`,
      cours.matiere
    );
  }

  return exercice;
}

export async function supprimerExerciceCode(id: string) {
  const exercice = await prisma.exercice.findUnique({ where: { id } });
  if (!exercice || !estTypeExerciceCode(exercice.type)) {
    throw new ExerciceCodeError("Exercice introuvable.");
  }

  await prisma.exercice.delete({ where: { id } });
}

export async function listerExercicesCodeCours(coursId: string) {
  return prisma.exercice.findMany({
    where: { coursId, type: { in: [...TYPES_EXERCICE_CODE] } },
    orderBy: [{ ordre: "asc" }, { id: "asc" }],
  });
}

export async function obtenirExerciceCode(id: string) {
  const exercice = await prisma.exercice.findUnique({ where: { id } });
  if (!exercice || !estTypeExerciceCode(exercice.type)) return null;
  return exercice;
}
