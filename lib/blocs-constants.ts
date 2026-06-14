import type { TypeBloc } from "@prisma/client";

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
 */
export function urlVideoEmbed(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }

  const host = u.hostname.replace(/^www\./, "");

  if (host === "youtube.com" || host === "m.youtube.com") {
    if (u.pathname === "/watch") {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.pathname.startsWith("/embed/")) {
      return `https://www.youtube.com${u.pathname}`;
    }
    if (u.pathname.startsWith("/shorts/")) {
      const id = u.pathname.split("/")[2];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    return null;
  }

  if (host === "youtu.be") {
    const id = u.pathname.slice(1);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  if (host === "vimeo.com") {
    const id = u.pathname.split("/").filter(Boolean)[0];
    return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
  }

  if (host === "player.vimeo.com") {
    return u.toString();
  }

  return null;
}
