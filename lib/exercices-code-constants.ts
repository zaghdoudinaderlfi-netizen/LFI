import { TypeExercice } from "@prisma/client";

// Constantes et utilitaires purs liés aux exercices de code (Python / Turtle,
// exécutés côté élève via Skulpt), sans dépendance à Prisma/Supabase
// (lib/prisma.ts importe `pg`, incompatible avec un bundle client). Ce module
// peut être importé aussi bien par des composants serveur que par des
// composants client.

export class ExerciceCodeError extends Error {}

export const TYPES_EXERCICE_CODE = [TypeExercice.PYTHON, TypeExercice.TURTLE] as const;

export const TYPE_EXERCICE_CODE_LABELS: Record<(typeof TYPES_EXERCICE_CODE)[number], string> = {
  [TypeExercice.PYTHON]: "Python (sortie attendue, correction automatique)",
  [TypeExercice.TURTLE]: "Turtle / dessin (correction manuelle)",
};

export function estTypeExerciceCode(type: TypeExercice): type is (typeof TYPES_EXERCICE_CODE)[number] {
  return (TYPES_EXERCICE_CODE as readonly TypeExercice[]).includes(type);
}
