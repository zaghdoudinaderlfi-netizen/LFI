// Formulaire de création de cours simplifié (5 boutons : HTML / PDF / WORD /
// VIDEO / QCM). Indépendant du système d'import Word→HTML existant
// (lib/docx.ts) : ici le fichier déposé est stocké tel quel dans Supabase
// Storage, sans conversion, et le QCM réutilise un Quiz existant tel quel.
import { randomUUID } from "crypto";
import { Matiere, Niveau, TypeCoursSimple } from "@prisma/client";
import { prisma } from "./prisma";
import { genererSlugUnique } from "./cours";
import { notifierElevesDuNiveau } from "./notifications";
import { extraireEmbedVideo } from "./video";
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

// ───────────────────────────────────────────────
//  CRÉATION DU COURS
// ───────────────────────────────────────────────

export type CoursSimpleInfoInput = {
  titre: string;
  niveau: Niveau;
  matiere: Matiere;
  publie: boolean;
  chapitre?: number | null;
};

export type ContenuCoursSimple =
  | { type: "HTML" | "PDF" | "WORD"; fichier: File }
  | { type: "VIDEO"; videoUrl: string }
  | { type: "QCM"; quizId: string };

/**
 * Crée un cours via le formulaire simplifié (5 boutons). Contrairement à
 * `creerCours` (éditeur avancé), le contenu est toujours fourni dès la
 * création — pas de brouillon vide possible avec cette fonction.
 */
export async function creerCoursSimple(data: CoursSimpleInfoInput, contenu: ContenuCoursSimple) {
  if (!data.titre.trim()) {
    throw new CoursSimpleError("Le titre est obligatoire.");
  }

  const slug = await genererSlugUnique(data.titre);
  const dossierId = randomUUID();

  let champs: {
    typeSimple: TypeCoursSimple;
    fichierUrl: string | null;
    videoUrl: string | null;
    quizId: string | null;
  };

  if (contenu.type === "VIDEO") {
    const embed = extraireEmbedVideo(contenu.videoUrl);
    if (!embed) {
      throw new CoursSimpleError("Lien YouTube ou Vimeo invalide.");
    }
    champs = { typeSimple: "VIDEO", fichierUrl: null, videoUrl: contenu.videoUrl.trim(), quizId: null };
  } else if (contenu.type === "QCM") {
    const quiz = await prisma.quiz.findUnique({ where: { id: contenu.quizId }, select: { id: true } });
    if (!quiz) {
      throw new CoursSimpleError("Quiz introuvable.");
    }
    champs = { typeSimple: "QCM", fichierUrl: null, videoUrl: null, quizId: quiz.id };
  } else {
    const fichierUrl = await televerserFichierCoursSimple(dossierId, contenu.fichier, contenu.type);
    champs = { typeSimple: contenu.type, fichierUrl, videoUrl: null, quizId: null };
  }

  const cours = await prisma.cours.create({
    data: {
      titre: data.titre.trim(),
      slug,
      contenu: "",
      niveau: data.niveau,
      matiere: data.matiere,
      publie: data.publie,
      chapitre: data.chapitre ?? null,
      ...champs,
    },
  });

  if (cours.publie) {
    await notifierElevesDuNiveau(
      cours.niveau,
      `Nouveau cours publié : « ${cours.titre} »`,
      `/eleve/cours/${cours.slug}`,
      cours.matiere
    );
  }

  return cours;
}
