"use server";

import { revalidatePath } from "next/cache";
import { TypeExercice } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  creerDevoir,
  definirModeRemiseFormulaire,
  definirSujetDevoir,
  definirSujetFormulaire,
  supprimerDevoir,
  supprimerSujetDevoir,
  DevoirError,
  ModeRemiseFormulaire,
} from "@/lib/devoirs";

async function revaliderCours(coursId: string) {
  revalidatePath(`/prof/cours/${coursId}`);
  revalidatePath(`/prof/cours/${coursId}/apercu`);

  const cours = await prisma.cours.findUnique({ where: { id: coursId }, select: { slug: true } });
  if (cours) {
    revalidatePath(`/eleve/cours/${cours.slug}`);
  }
}

export async function creerDevoirAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role !== "PROF") {
    return "Accès réservé aux professeurs.";
  }

  const coursId = formData.get("coursId");
  const titre = formData.get("titre");
  const consigne = formData.get("consigne");
  const points = formData.get("points");
  const dateLimite = formData.get("dateLimite");
  const type = formData.get("type");
  const sujet = formData.get("sujet");
  const modeRemise = formData.get("modeRemise");

  if (
    typeof coursId !== "string" ||
    typeof titre !== "string" ||
    typeof consigne !== "string" ||
    typeof points !== "string" ||
    typeof type !== "string"
  ) {
    return "Formulaire invalide.";
  }

  if (type !== TypeExercice.DEVOIR_PDF && type !== TypeExercice.DEVOIR_PDF_FORMULAIRE) {
    return "Type de devoir invalide.";
  }

  const estFormulaire = type === TypeExercice.DEVOIR_PDF_FORMULAIRE;

  if (estFormulaire && (!(sujet instanceof File) || sujet.size === 0)) {
    return "Le PDF-formulaire est obligatoire pour ce type de devoir.";
  }

  const modeRemiseValide =
    modeRemise === ModeRemiseFormulaire.EN_LIGNE || modeRemise === ModeRemiseFormulaire.TELECHARGEMENT
      ? modeRemise
      : ModeRemiseFormulaire.EN_LIGNE;

  let devoir;
  try {
    devoir = await creerDevoir(coursId, {
      titre,
      consigne,
      points: Number(points),
      dateLimite: typeof dateLimite === "string" && dateLimite ? new Date(dateLimite) : null,
      type,
      modeRemise: modeRemiseValide,
    });
  } catch (error) {
    if (error instanceof DevoirError) return error.message;
    throw error;
  }

  await revaliderCours(coursId);

  if (sujet instanceof File && sujet.size > 0) {
    try {
      if (estFormulaire) {
        await definirSujetFormulaire(devoir.id, sujet);
      } else {
        await definirSujetDevoir(devoir.id, sujet);
      }
    } catch (error) {
      if (error instanceof DevoirError) {
        const cible = estFormulaire ? "PDF-formulaire" : "sujet";
        return `Devoir ajouté, mais l'envoi du ${cible} a échoué : ${error.message}`;
      }
      throw error;
    }
    await revaliderCours(coursId);
  }

  return "Devoir ajouté.";
}

export async function supprimerDevoirAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (session?.user?.role !== "PROF") {
    return;
  }

  const id = formData.get("id");
  const coursId = formData.get("coursId");

  if (typeof id !== "string" || typeof coursId !== "string") {
    return;
  }

  await supprimerDevoir(id);

  await revaliderCours(coursId);
}

export async function definirSujetDevoirAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role !== "PROF") {
    return "Accès réservé aux professeurs.";
  }

  const devoirId = formData.get("devoirId");
  const coursId = formData.get("coursId");
  const sujet = formData.get("sujet");

  if (typeof devoirId !== "string" || typeof coursId !== "string") {
    return "Formulaire invalide.";
  }

  if (!(sujet instanceof File) || sujet.size === 0) {
    return "Sélectionne un fichier.";
  }

  try {
    await definirSujetDevoir(devoirId, sujet);
  } catch (error) {
    if (error instanceof DevoirError) return error.message;
    throw error;
  }

  await revaliderCours(coursId);
  return "Sujet ajouté.";
}

export async function definirSujetFormulaireAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role !== "PROF") {
    return "Accès réservé aux professeurs.";
  }

  const devoirId = formData.get("devoirId");
  const coursId = formData.get("coursId");
  const sujet = formData.get("sujet");

  if (typeof devoirId !== "string" || typeof coursId !== "string") {
    return "Formulaire invalide.";
  }

  if (!(sujet instanceof File) || sujet.size === 0) {
    return "Sélectionne un fichier.";
  }

  try {
    await definirSujetFormulaire(devoirId, sujet);
  } catch (error) {
    if (error instanceof DevoirError) return error.message;
    throw error;
  }

  await revaliderCours(coursId);
  return "Sujet ajouté.";
}

export async function definirModeRemiseFormulaireAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role !== "PROF") {
    return "Accès réservé aux professeurs.";
  }

  const devoirId = formData.get("devoirId");
  const coursId = formData.get("coursId");
  const modeRemise = formData.get("modeRemise");

  if (typeof devoirId !== "string" || typeof coursId !== "string") {
    return "Formulaire invalide.";
  }

  if (modeRemise !== ModeRemiseFormulaire.EN_LIGNE && modeRemise !== ModeRemiseFormulaire.TELECHARGEMENT) {
    return "Mode de remise invalide.";
  }

  try {
    await definirModeRemiseFormulaire(devoirId, modeRemise);
  } catch (error) {
    if (error instanceof DevoirError) return error.message;
    throw error;
  }

  await revaliderCours(coursId);
  return "Mode de remise mis à jour.";
}

export async function supprimerSujetDevoirAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (session?.user?.role !== "PROF") {
    return;
  }

  const devoirId = formData.get("devoirId");
  const coursId = formData.get("coursId");

  if (typeof devoirId !== "string" || typeof coursId !== "string") {
    return;
  }

  await supprimerSujetDevoir(devoirId);

  await revaliderCours(coursId);
}
