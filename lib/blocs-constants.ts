import type { TypeBloc } from "@prisma/client";
import { extraireEmbedVideo } from "./video";

// Constantes et utilitaires purs liés aux blocs, sans dépendance à Prisma/Supabase
// (lib/prisma.ts importe `pg`, incompatible avec un bundle client). Ce module peut
// être importé aussi bien par des composants serveur que par des composants client.

export class BlocError extends Error {}

export const TYPE_BLOC_LABELS: Record<TypeBloc, string> = {
  TEXTE: "Texte",
  IMAGE: "Image",
  PDF: "PDF",
  VIDEO: "Vidéo",
  ACTIVITE: "Outil de code / activité externe",
  LIEN: "Lien",
  EDITEUR_PYTHON: "Éditeur Python",
};

// Liste extensible : ajouter une entrée ici suffit pour proposer un nouvel
// outil dans le formulaire, sans migration.
export const OUTILS_ACTIVITE = {
  VITTASCIENCE: "Vittascience",
  PYTHON: "Python en ligne",
  MICROBIT: "micro:bit",
  ARDUINO_WOKWI: "Arduino / Wokwi",
  MBLOCK: "mBlock en ligne",
  PHET: "PhET",
  GEOGEBRA: "GeoGebra",
} as const;

export type OutilActiviteConnu = keyof typeof OUTILS_ACTIVITE;

/** Libellé lisible d'un outil : valeur connue, ou nom libre (cas "Autre"). */
export function libelleOutil(outil: string): string {
  return OUTILS_ACTIVITE[outil as OutilActiviteConnu] ?? outil;
}

/**
 * Convertit un lien YouTube ou Vimeo en URL d'intégration (iframe).
 * Retourne `null` si le lien n'est pas reconnu.
 *
 * Délègue à `extraireEmbedVideo` : les blocs vidéo profitent ainsi du même
 * lecteur que les cours de type VIDEO — domaine sans cookie côté YouTube et
 * paramètres qui retirent vidéos suggérées, annotations, titre et auteur.
 */
export function urlVideoEmbed(url: string): string | null {
  return extraireEmbedVideo(url)?.embedUrl ?? null;
}
