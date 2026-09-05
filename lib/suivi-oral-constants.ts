// Constantes et calculs purs du suivi oral — séparés de lib/suivi-oral.ts
// (qui importe Prisma, marqué "server-only") pour rester importables depuis
// des composants client (sélecteur/affichage d'étoiles).
import { Trimestre } from "@prisma/client";

export const TRIMESTRE_LABELS: Record<Trimestre, string> = {
  T1: "1er trimestre",
  T2: "2e trimestre",
  T3: "3e trimestre",
};

export const ETOILES_MAX = 5;
const NOTE_SUR = 20;

export const CRITERES = ["travailFait", "compteRendu", "assiduite"] as const;
export type Critere = (typeof CRITERES)[number];

export const CRITERE_LABELS: Record<Critere, string> = {
  travailFait: "Travail toujours fait",
  compteRendu: "Comptes-rendus",
  assiduite: "Assiduité en classe",
};

/** T1 = sept-déc, T2 = janv-mars, T3 = avril-août. */
export function trimestreDeDate(date: Date): Trimestre {
  const mois = date.getMonth(); // 0 = janvier
  if (mois >= 8) return "T1"; // sept (8) à déc (11)
  if (mois <= 2) return "T2"; // janv (0) à mars (2)
  return "T3"; // avril (3) à août (7)
}

export function trimestreActuel(): Trimestre {
  return trimestreDeDate(new Date());
}

/** Convertit une moyenne /5 en note orale /20, arrondie au dixième. */
export function noteSur20(moyenneSur5: number): number {
  return Math.round(((moyenneSur5 / ETOILES_MAX) * NOTE_SUR) * 10) / 10;
}
