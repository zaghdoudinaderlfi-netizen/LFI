import type { Niveau } from "@prisma/client";

// Constantes pures liées aux classes, sans dépendance à Prisma/Supabase.
// Ce module peut être importé aussi bien par des composants serveur que client.

export const NIVEAU_LABELS: Record<Niveau, string> = {
  TROISIEME: "3ème",
  SECONDE: "2nde",
};
