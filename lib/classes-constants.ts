import type { Matiere, Niveau } from "@prisma/client";

// Constantes pures liées aux classes, sans dépendance à Prisma/Supabase.
// Ce module peut être importé aussi bien par des composants serveur que client.

export const NIVEAU_LABELS: Record<Niveau, string> = {
  TROISIEME: "3ème",
  SECONDE: "2nde",
  PREMIERE: "1ère",
};

export const MATIERE_LABELS: Record<Matiere, string> = {
  TECHNOLOGIE: "Technologie",
  SNT: "SNT",
  NSI: "NSI",
};

// Matière principale associée à chaque niveau (convention pédagogique).
// Utilisé pour filtrer les classes par onglet matière dans le tableau de bord.
export const NIVEAU_PAR_MATIERE: Record<string, Niveau> = {
  TECHNOLOGIE: "TROISIEME",
  SNT: "SECONDE",
  NSI: "PREMIERE",
};

// Inverse de NIVEAU_PAR_MATIERE : la matière d'un élève se déduit du niveau
// de sa classe. Sert à borner tout ce qu'un élève peut voir (cours, quiz,
// devoirs, notifications) à sa propre section, même si un contenu est
// mal étiqueté côté prof (matiere ne correspondant pas à son niveau).
export const MATIERE_PAR_NIVEAU: Record<Niveau, Matiere> = {
  TROISIEME: "TECHNOLOGIE",
  SECONDE: "SNT",
  PREMIERE: "NSI",
};

export const MATIERES_VALIDES = new Set<string>(["TECHNOLOGIE", "SNT", "NSI"]);

export function estMatiereValide(m: string | null | undefined): m is Matiere {
  return !!m && MATIERES_VALIDES.has(m);
}
