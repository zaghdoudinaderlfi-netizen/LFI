import { randomUUID } from "crypto";
import { Matiere, Niveau, TypeContenuCours } from "@prisma/client";
import { prisma } from "./prisma";
import { notifierElevesDuNiveau } from "./notifications";
import { nomFichierSur } from "./fichiers";
import { supabaseAdmin, BUCKET_PIECES_JOINTES, BUCKET_RENDUS_DEVOIRS, BUCKET_IMAGES_COURS, assurerBucketPublic } from "./supabase";
import { convertirDocxEnHtml, supprimerImagesCours } from "./docx";

const PREFIX_COUVERTURE = "couvertures";
const EXTENSIONS_IMAGE_COUVERTURE = new Set(["png", "jpg", "jpeg", "gif", "webp"]);
const TAILLE_MAX_IMAGE = 5 * 1024 * 1024; // 5 Mo

export function urlImageCouverture(chemin: string | null): string | null {
  if (!chemin) return null;
  const { data } = supabaseAdmin.storage.from(BUCKET_IMAGES_COURS).getPublicUrl(chemin);
  return data.publicUrl;
}

export async function televerserImageCouverture(coursId: string, fichier: File): Promise<string> {
  if (fichier.size > TAILLE_MAX_IMAGE) {
    throw new CoursError("L'image dépasse la taille maximale autorisée (5 Mo).");
  }

  const ext = fichier.name.split(".").pop()?.toLowerCase() ?? "";
  if (!EXTENSIONS_IMAGE_COUVERTURE.has(ext)) {
    throw new CoursError("Format d'image non supporté. Utilise PNG, JPG, GIF ou WebP.");
  }

  await assurerBucketPublic(BUCKET_IMAGES_COURS);

  const nomNettoye = nomFichierSur(fichier.name);
  const chemin = `${PREFIX_COUVERTURE}/${coursId}/${randomUUID()}-${nomNettoye}`;

  const { error } = await supabaseAdmin.storage.from(BUCKET_IMAGES_COURS).upload(chemin, fichier, {
    contentType: fichier.type || "image/png",
    upsert: false,
  });

  if (error) throw new CoursError("Échec de l'envoi de l'image de couverture.");

  return chemin;
}

async function supprimerImageCouverture(chemin: string | null) {
  if (!chemin) return;
  await supabaseAdmin.storage.from(BUCKET_IMAGES_COURS).remove([chemin]);
}

export class CoursError extends Error {}

export const MATIERE_LABELS: Record<Matiere, string> = {
  TECHNOLOGIE: "Technologie",
  SNT: "SNT",
  NSI: "NSI",
};

const PREFIX_PDF_COURS = "cours-pdf";

function slugify(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function genererSlugUnique(titre: string, excludeId?: string) {
  const base = slugify(titre) || "cours";
  let slug = base;
  let suffixe = 2;

  for (;;) {
    const existant = await prisma.cours.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existant || existant.id === excludeId) return slug;
    slug = `${base}-${suffixe}`;
    suffixe += 1;
  }
}

type CoursInfoInput = {
  titre: string;
  niveau: Niveau;
  matiere: Matiere;
  publie: boolean;
};

export type ContenuFichier =
  | { type: "DOCX"; buffer: Buffer }
  | { type: "PDF"; fichier: File };

async function televerserPdfCours(dossierId: string, fichier: File) {
  const nomNettoye = nomFichierSur(fichier.name);
  const chemin = `${PREFIX_PDF_COURS}/${dossierId}/${randomUUID()}-${nomNettoye}`;

  const { error } = await supabaseAdmin.storage.from(BUCKET_PIECES_JOINTES).upload(chemin, fichier, {
    contentType: fichier.type || "application/pdf",
    upsert: false,
  });

  if (error) {
    throw new CoursError("Échec de l'envoi du fichier PDF.");
  }

  return {
    pdfNom: fichier.name,
    pdfChemin: chemin,
    pdfTaille: fichier.size,
    pdfTypeMime: fichier.type || "application/pdf",
  };
}

async function supprimerPdfCours(chemin: string | null) {
  if (!chemin) return;
  await supabaseAdmin.storage.from(BUCKET_PIECES_JOINTES).remove([chemin]);
}

async function resoudreContenu(dossierId: string, contenuFichier: ContenuFichier) {
  if (contenuFichier.type === "DOCX") {
    const html = await convertirDocxEnHtml(contenuFichier.buffer, dossierId);
    return {
      typeContenu: TypeContenuCours.HTML,
      contenu: html,
      pdfNom: null,
      pdfChemin: null,
      pdfTaille: null,
      pdfTypeMime: null,
    };
  }

  const pdf = await televerserPdfCours(dossierId, contenuFichier.fichier);
  return {
    typeContenu: TypeContenuCours.PDF,
    contenu: "",
    ...pdf,
  };
}

function contenuEstVide(cours: { typeContenu: TypeContenuCours; contenu: string; pdfChemin: string | null }) {
  return cours.typeContenu === TypeContenuCours.HTML ? !cours.contenu.trim() : !cours.pdfChemin;
}

const CONTENU_VIDE = {
  typeContenu: TypeContenuCours.HTML,
  contenu: "",
  pdfNom: null,
  pdfChemin: null,
  pdfTaille: null,
  pdfTypeMime: null,
} as const;

export async function creerCours(data: CoursInfoInput, contenuFichier: ContenuFichier | null) {
  if (!data.titre.trim()) {
    throw new CoursError("Le titre est obligatoire.");
  }

  const slug = await genererSlugUnique(data.titre);
  const champsContenu = contenuFichier
    ? await resoudreContenu(randomUUID(), contenuFichier)
    : CONTENU_VIDE;

  // Sans fichier ni blocs, on ne peut pas publier directement depuis le formulaire de création.
  if (data.publie && contenuEstVide(champsContenu)) {
    throw new CoursError("Ajoute du contenu (blocs ou fichier importé) avant de publier ce cours.");
  }

  const cours = await prisma.cours.create({
    data: {
      titre: data.titre.trim(),
      slug,
      niveau: data.niveau,
      matiere: data.matiere,
      publie: data.publie,
      ...champsContenu,
    },
  });

  if (cours.publie) {
    await notifierElevesDuNiveau(
      cours.niveau,
      `Nouveau cours publié : « ${cours.titre} »`,
      `/eleve/cours/${cours.slug}`
    );
  }

  return cours;
}

export async function modifierCours(id: string, data: CoursInfoInput) {
  const cours = await prisma.cours.findUnique({
    where: { id },
    include: { _count: { select: { blocs: true } } },
  });
  if (!cours) {
    throw new CoursError("Cours introuvable.");
  }

  if (!data.titre.trim()) {
    throw new CoursError("Le titre est obligatoire.");
  }

  const aContenu =
    !contenuEstVide(cours) || cours._count.blocs > 0 || !!cours.pageInteractive;
  if (data.publie && !aContenu) {
    throw new CoursError(
      "Ce cours n'a pas encore de contenu : ajoute des blocs, importe un fichier ou associe une page interactive avant de le publier."
    );
  }

  const titre = data.titre.trim();
  const slug = titre === cours.titre ? cours.slug : await genererSlugUnique(titre, id);

  const misAJour = await prisma.cours.update({
    where: { id },
    data: {
      titre,
      slug,
      niveau: data.niveau,
      matiere: data.matiere,
      publie: data.publie,
    },
  });

  if (!cours.publie && misAJour.publie) {
    await notifierElevesDuNiveau(
      misAJour.niveau,
      `Nouveau cours publié : « ${misAJour.titre} »`,
      `/eleve/cours/${misAJour.slug}`
    );
  }

  return misAJour;
}

/**
 * Remplace le contenu d'un cours existant par un nouvel import (Word ou
 * PDF). Le titre, le niveau, la matière et le statut de publication ne sont
 * pas modifiés.
 */
export async function remplacerContenuCours(id: string, contenuFichier: ContenuFichier) {
  const cours = await prisma.cours.findUnique({ where: { id } });
  if (!cours) {
    throw new CoursError("Cours introuvable.");
  }

  const champsContenu = await resoudreContenu(id, contenuFichier);

  const misAJour = await prisma.cours.update({
    where: { id },
    data: champsContenu,
  });

  // Nettoyage de l'ancien contenu, après succès de la mise à jour.
  if (cours.pdfChemin && cours.pdfChemin !== misAJour.pdfChemin) {
    await supprimerPdfCours(cours.pdfChemin);
  }
  if (cours.typeContenu === TypeContenuCours.HTML && contenuFichier.type === "PDF") {
    await supprimerImagesCours(id);
  }

  return misAJour;
}

export async function listerCoursProf() {
  return prisma.cours.findMany({
    orderBy: [{ niveau: "asc" }, { matiere: "asc" }, { ordre: "asc" }, { createdAt: "desc" }],
  });
}

export async function obtenirCoursParId(id: string) {
  return prisma.cours.findUnique({ where: { id } });
}

export async function listerCoursPublies(niveau: Niveau) {
  return prisma.cours.findMany({
    where: { niveau, publie: true },
    orderBy: [{ matiere: "asc" }, { ordre: "asc" }, { createdAt: "asc" }],
  });
}

export async function obtenirCoursPublieParSlug(slug: string, niveau: Niveau) {
  return prisma.cours.findFirst({
    where: { slug, niveau, publie: true },
  });
}

export async function listerDerniersCoursPublies(niveau: Niveau, limit = 5) {
  return prisma.cours.findMany({
    where: { niveau, publie: true },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}

export async function supprimerCours(id: string) {
  const cours = await prisma.cours.findUnique({
    where: { id },
    include: {
      blocs: { select: { fichierChemin: true } },
      piecesJointes: { select: { chemin: true } },
      exercices: {
        select: {
          sujetChemin: true,
          soumissions: { select: { fichierChemin: true } },
        },
      },
    },
  });

  if (!cours) throw new CoursError("Cours introuvable.");

  // Supprimer les fichiers des soumissions élèves (rendus-lfi)
  const cheminsSoumissions = cours.exercices
    .flatMap((e) => e.soumissions.map((s) => s.fichierChemin))
    .filter((c): c is string => !!c);
  if (cheminsSoumissions.length > 0) {
    await supabaseAdmin.storage.from(BUCKET_RENDUS_DEVOIRS).remove(cheminsSoumissions);
  }

  // Supprimer les sujets des devoirs/exercices (fichiers-lfi)
  const cheminsSujets = cours.exercices
    .map((e) => e.sujetChemin)
    .filter((c): c is string => !!c);
  if (cheminsSujets.length > 0) {
    await supabaseAdmin.storage.from(BUCKET_PIECES_JOINTES).remove(cheminsSujets);
  }

  // Supprimer les fichiers des blocs IMAGE/PDF (fichiers-lfi)
  const cheminsBlocs = cours.blocs
    .map((b) => b.fichierChemin)
    .filter((c): c is string => !!c);
  if (cheminsBlocs.length > 0) {
    await supabaseAdmin.storage.from(BUCKET_PIECES_JOINTES).remove(cheminsBlocs);
  }

  // Supprimer les pièces jointes (fichiers-lfi)
  const cheminsPJ = cours.piecesJointes.map((p) => p.chemin);
  if (cheminsPJ.length > 0) {
    await supabaseAdmin.storage.from(BUCKET_PIECES_JOINTES).remove(cheminsPJ);
  }

  // Supprimer le PDF du cours si applicable (fichiers-lfi)
  if (cours.pdfChemin) {
    await supabaseAdmin.storage.from(BUCKET_PIECES_JOINTES).remove([cours.pdfChemin]);
  }

  // Supprimer l'image de couverture si présente
  if (cours.imageCouvertureChemin) {
    await supprimerImageCouverture(cours.imageCouvertureChemin);
  }

  // Supprimer le dossier d'images (cours HTML importé depuis Word)
  if (cours.typeContenu === TypeContenuCours.HTML) {
    await supprimerImagesCours(id);
  }

  // Supprimer le cours en DB (cascade gère exercices, soumissions, blocs, PJ)
  await prisma.cours.delete({ where: { id } });
}
