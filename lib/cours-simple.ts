// Stockage des fichiers du formulaire de création de cours simplifié
// (5 boutons : HTML / PDF / WORD / VIDEO / QCM). Indépendant du système
// d'import Word→HTML existant (lib/docx.ts) : ici le fichier déposé est
// stocké tel quel dans Supabase Storage, sans conversion.
import { randomUUID } from "crypto";
import { TypeCoursSimple } from "@prisma/client";
import { nomFichierSur } from "./fichiers";
import { supabaseAdmin, BUCKET_COURS_SIMPLE, assurerBucketPublic } from "./supabase";

export class CoursSimpleError extends Error {}

const TAILLE_MAX_OCTETS = 20 * 1024 * 1024; // 20 Mo

type TypeAvecFichier = "HTML" | "PDF" | "WORD";

const EXTENSIONS_PAR_TYPE: Record<TypeAvecFichier, Set<string>> = {
  HTML: new Set(["html", "htm"]),
  PDF: new Set(["pdf"]),
  WORD: new Set(["docx"]),
};

const MIME_PAR_DEFAUT: Record<TypeAvecFichier, string> = {
  HTML: "text/html",
  PDF: "application/pdf",
  WORD: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export function typeCoursAFichier(type: TypeCoursSimple): type is TypeAvecFichier {
  return type === "HTML" || type === "PDF" || type === "WORD";
}

/**
 * Dépose un fichier HTML/PDF/Word dans le bucket "cours" et renvoie son URL
 * publique, à stocker directement dans `Cours.fichierUrl`.
 */
export async function televerserFichierCoursSimple(
  coursId: string,
  fichier: File,
  type: TypeAvecFichier
): Promise<string> {
  if (fichier.size === 0) {
    throw new CoursSimpleError("Le fichier est vide.");
  }
  if (fichier.size > TAILLE_MAX_OCTETS) {
    throw new CoursSimpleError("Le fichier dépasse la taille maximale autorisée (20 Mo).");
  }

  const extensions = EXTENSIONS_PAR_TYPE[type];
  const extension = fichier.name.split(".").pop()?.toLowerCase() ?? "";
  if (!extensions.has(extension)) {
    const attendues = [...extensions].map((e) => `.${e}`).join(" ou ");
    throw new CoursSimpleError(`Format de fichier non autorisé pour ce type de cours (${attendues} attendu).`);
  }

  await assurerBucketPublic(BUCKET_COURS_SIMPLE);

  const nomNettoye = nomFichierSur(fichier.name);
  const chemin = `${type.toLowerCase()}/${coursId}/${randomUUID()}-${nomNettoye}`;

  const { error } = await supabaseAdmin.storage.from(BUCKET_COURS_SIMPLE).upload(chemin, fichier, {
    contentType: fichier.type || MIME_PAR_DEFAUT[type],
    upsert: false,
  });

  if (error) {
    throw new CoursSimpleError("Échec de l'envoi du fichier.");
  }

  const { data } = supabaseAdmin.storage.from(BUCKET_COURS_SIMPLE).getPublicUrl(chemin);
  return data.publicUrl;
}

/** Supprime du bucket "cours" le fichier référencé par une URL publique stockée en base. */
export async function supprimerFichierCoursSimple(fichierUrl: string | null) {
  if (!fichierUrl) return;
  const chemin = cheminDepuisUrlPublique(fichierUrl);
  if (!chemin) return;
  await supabaseAdmin.storage.from(BUCKET_COURS_SIMPLE).remove([chemin]);
}

function cheminDepuisUrlPublique(url: string): string | null {
  const marqueur = `/object/public/${BUCKET_COURS_SIMPLE}/`;
  const index = url.indexOf(marqueur);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marqueur.length));
}
