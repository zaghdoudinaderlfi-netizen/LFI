import type { Niveau } from "@prisma/client";

// Constantes pures liées aux classes, sans dépendance à Prisma/Supabase.
// Ce module peut être importé aussi bien par des composants serveur que client.

export const NIVEAU_LABELS: Record<Niveau, string> = {
  TROISIEME: "3ème",
  SECONDE: "2nde",
  PREMIERE: "1ère",
};

// Matière principale associée à chaque niveau (convention pédagogique).
// Utilisé pour filtrer les classes par onglet matière dans le tableau de bord.
export const NIVEAU_PAR_MATIERE: Record<string, Niveau> = {
  TECHNOLOGIE: "TROISIEME",
  SNT: "SECONDE",
  NSI: "PREMIERE",
};
