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

// ───────────────────────────────────────────────
//  BOUCLIERS (progression ludique cumulée)
// ───────────────────────────────────────────────

// Un point = une étoile donnée (travail fait, assiduité, ou note d'un
// compte-rendu). Cumulés sur toute l'année (jamais remis à zéro) — c'est la
// jauge de motivation, séparée de la note orale du trimestre (qui, elle,
// repart de zéro chaque trimestre — voir POINTS_PAR_PALIER ci-dessous et
// TrimestreSuivi.note20 dans lib/suivi-oral.ts).
export const POINTS_PAR_PALIER = 50;

export type PalierBouclier = {
  id: string;
  nom: string;
  seuil: number; // points cumulés à partir desquels ce palier est atteint
  couleur: string; // couleur du bouclier (valeur CSS)
};

export const PALIERS_BOUCLIER: PalierBouclier[] = [
  { id: "acier", nom: "Acier", seuil: 0, couleur: "#94a3b8" },
  { id: "bronze", nom: "Bronze", seuil: POINTS_PAR_PALIER * 1, couleur: "#b08d57" },
  { id: "cuivre", nom: "Cuivre", seuil: POINTS_PAR_PALIER * 2, couleur: "#d97846" },
  { id: "argent", nom: "Argent", seuil: POINTS_PAR_PALIER * 3, couleur: "#cbd5e1" },
  { id: "or", nom: "Or", seuil: POINTS_PAR_PALIER * 4, couleur: "#eab308" },
  { id: "diamant", nom: "Diamant", seuil: POINTS_PAR_PALIER * 6, couleur: "#67e8f9" },
];

/** Le palier atteint pour un total de points cumulés donné. */
export function palierDePoints(points: number): PalierBouclier {
  let atteint = PALIERS_BOUCLIER[0];
  for (const palier of PALIERS_BOUCLIER) {
    if (points >= palier.seuil) atteint = palier;
    else break;
  }
  return atteint;
}

/** Le prochain palier à atteindre, ou null si le maximum est déjà atteint. */
export function prochainPalier(points: number): PalierBouclier | null {
  return PALIERS_BOUCLIER.find((p) => p.seuil > points) ?? null;
}
