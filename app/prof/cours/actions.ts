"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Matiere, Niveau, TypeCoursSimple } from "@prisma/client";
import { auth } from "@/auth";
import {
  CoursError,
  type ContenuFichier,
  creerCours,
  modifierCours,
  remplacerContenuCours,
  supprimerCours,
  basculerVisibiliteEleves,
  basculerEstPublic,
  basculerVitrine,
} from "@/lib/cours";
import {
  CoursSimpleError,
  type ContenuCoursSimple,
  creerCoursSimple,
} from "@/lib/cours-simple";
import { DocxError } from "@/lib/docx";
import { TAILLE_MAX_OCTETS, extensionDe } from "@/lib/fichiers";

function lireInfosFormulaire(formData: FormData) {
  const titre = formData.get("titre");
  const niveau = formData.get("niveau");
  const matiere = formData.get("matiere");
  const publie = formData.get("publie") === "on";
  const correctionVisible = formData.get("correctionVisible") === "on";
  const chapitreRaw = formData.get("chapitre");
  const chapitre =
    chapitreRaw && typeof chapitreRaw === "string" && chapitreRaw.trim() !== ""
      ? (parseInt(chapitreRaw, 10) || null)
      : null;

  if (typeof titre !== "string" || typeof niveau !== "string" || typeof matiere !== "string") {
    return null;
  }

  if (niveau !== "TROISIEME" && niveau !== "SECONDE" && niveau !== "PREMIERE") return null;
  if (matiere !== "TECHNOLOGIE" && matiere !== "SNT" && matiere !== "NSI") return null;

  return {
    titre,
    niveau: niveau as Niveau,
    matiere: matiere as Matiere,
    publie,
    correctionVisible,
    chapitre,
  };
}

type ResultatContenuFichier =
  | { ok: true; contenu: ContenuFichier | null }
  | { ok: false; erreur: string };

async function lireContenuFichier(formData: FormData): Promise<ResultatContenuFichier> {
  const fichier = formData.get("fichier");

  // Pas de fichier : autorisé à la création, contenu null
  if (!(fichier instanceof File) || fichier.size === 0) {
    return { ok: true, contenu: null };
  }

  if (fichier.size > TAILLE_MAX_OCTETS) {
    return { ok: false, erreur: "Le fichier dépasse la taille maximale autorisée (10 Mo)." };
  }

  const extension = extensionDe(fichier.name);

  if (extension === "docx") {
    const buffer = Buffer.from(await fichier.arrayBuffer());
    return { ok: true, contenu: { type: "DOCX", buffer } };
  }

  if (extension === "pdf") {
    return { ok: true, contenu: { type: "PDF", fichier } };
  }

  return { ok: false, erreur: "Format de fichier non pris en charge. Utilise un fichier Word (.docx) ou PDF (.pdf)." };
}

const TYPES_COURS_SIMPLE = new Set<string>(["HTML", "PDF", "WORD", "VIDEO", "QCM"]);

function lireTypeSimple(formData: FormData): TypeCoursSimple | null {
  const type = formData.get("type");
  if (typeof type !== "string" || !TYPES_COURS_SIMPLE.has(type)) return null;
  return type as TypeCoursSimple;
}

type ResultatContenuSimple =
  | { ok: true; contenu: ContenuCoursSimple }
  | { ok: false; erreur: string };

function lireContenuSimple(formData: FormData, type: TypeCoursSimple): ResultatContenuSimple {
  if (type === "VIDEO") {
    const videoUrl = formData.get("videoUrl");
    if (typeof videoUrl !== "string" || !videoUrl.trim()) {
      return { ok: false, erreur: "Colle le lien YouTube ou Vimeo de la vidéo." };
    }
    return { ok: true, contenu: { type: "VIDEO", videoUrl } };
  }

  if (type === "QCM") {
    const quizId = formData.get("quizId");
    if (typeof quizId !== "string" || !quizId) {
      return { ok: false, erreur: "Choisis un quiz existant." };
    }
    return { ok: true, contenu: { type: "QCM", quizId } };
  }

  const fichier = formData.get("fichier");
  if (!(fichier instanceof File) || fichier.size === 0) {
    return { ok: false, erreur: "Dépose un fichier." };
  }
  return { ok: true, contenu: { type, fichier } };
}

export async function creerCoursAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role !== "PROF") {
    return "Accès réservé aux professeurs.";
  }

  const infos = lireInfosFormulaire(formData);
  if (!infos) {
    return "Formulaire invalide.";
  }

  // Un des 5 boutons a été choisi : cours mono-contenu créé directement.
  // Sinon (aucun bouton cliqué) : cours vierge, à composer ensuite avec
  // l'éditeur avancé (blocs, page interactive, import Word/PDF...), comme
  // avant l'ajout du formulaire simplifié.
  const typeSimple = lireTypeSimple(formData);

  let cours;
  try {
    if (typeSimple) {
      const resultat = lireContenuSimple(formData, typeSimple);
      if (!resultat.ok) return resultat.erreur;
      cours = await creerCoursSimple(infos, resultat.contenu);
    } else {
      cours = await creerCours(infos, null);
    }
  } catch (error) {
    if (error instanceof CoursError || error instanceof CoursSimpleError || error instanceof DocxError) {
      return error.message;
    }
    throw error;
  }

  revalidatePath("/prof/cours");
  redirect(typeSimple ? "/prof/cours" : `/prof/cours/${cours.id}`);
}

export async function modifierCoursAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role !== "PROF") {
    return "Accès réservé aux professeurs.";
  }

  const id = formData.get("id");
  if (typeof id !== "string") {
    return "Formulaire invalide.";
  }

  const infos = lireInfosFormulaire(formData);
  if (!infos) {
    return "Formulaire invalide.";
  }

  try {
    await modifierCours(id, infos);
  } catch (error) {
    if (error instanceof CoursError) return error.message;
    throw error;
  }

  revalidatePath("/prof/cours");
  revalidatePath(`/prof/cours/${id}`);
  revalidatePath(`/prof/cours/${id}/apercu`);

  return "Cours enregistré.";
}

export async function remplacerContenuAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role !== "PROF") {
    return "Accès réservé aux professeurs.";
  }

  const id = formData.get("coursId");
  if (typeof id !== "string") {
    return "Formulaire invalide.";
  }

  const resultatFichier = await lireContenuFichier(formData);
  if (!resultatFichier.ok) {
    return resultatFichier.erreur;
  }
  if (!resultatFichier.contenu) {
    return "Sélectionne un fichier Word (.docx) ou PDF (.pdf).";
  }

  try {
    await remplacerContenuCours(id, resultatFichier.contenu);
  } catch (error) {
    if (error instanceof CoursError || error instanceof DocxError) return error.message;
    throw error;
  }

  revalidatePath("/prof/cours");
  revalidatePath(`/prof/cours/${id}`);
  revalidatePath(`/prof/cours/${id}/apercu`);

  return "Contenu remplacé.";
}

export async function basculerVisibiliteElevesAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (session?.user?.role !== "PROF") return;

  const id = formData.get("coursId");
  const visible = formData.get("visible") === "true";
  if (typeof id !== "string") return;

  try {
    await basculerVisibiliteEleves(id, visible);
  } catch (error) {
    if (error instanceof CoursError) return;
    throw error;
  }

  revalidatePath("/prof/cours");
  revalidatePath("/eleve/cours");
}

export async function basculerEstPublicAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (session?.user?.role !== "PROF") return;

  const id = formData.get("coursId");
  const estPublic = formData.get("estPublic") === "true";
  if (typeof id !== "string") return;

  try {
    await basculerEstPublic(id, estPublic);
  } catch (error) {
    if (error instanceof CoursError) return;
    throw error;
  }

  revalidatePath("/prof/cours");
}

export async function basculerVitrineAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (session?.user?.role !== "PROF") return;

  const id = formData.get("coursId");
  const enVitrine = formData.get("enVitrine") === "true";
  if (typeof id !== "string") return;

  try {
    await basculerVitrine(id, enVitrine);
  } catch (error) {
    if (error instanceof CoursError) return;
    throw error;
  }

  revalidatePath("/prof/cours");
  revalidatePath("/");
}

export async function supprimerCoursAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (session?.user?.role !== "PROF") return;

  const id = formData.get("coursId");
  if (typeof id !== "string") return;

  try {
    await supprimerCours(id);
  } catch (error) {
    if (error instanceof CoursError) return;
    throw error;
  }

  revalidatePath("/prof/cours");
  redirect("/prof/cours");
}
