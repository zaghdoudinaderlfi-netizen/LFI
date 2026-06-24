"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  CoursError,
  televerserImageCouverture,
  urlImageCouverture,
} from "@/lib/cours";
import { supabaseAdmin, BUCKET_IMAGES_COURS } from "@/lib/supabase";

export async function modifierPageInteractiveAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role !== "PROF") return "Accès réservé aux professeurs.";

  const coursId = formData.get("coursId");
  if (typeof coursId !== "string") return "Formulaire invalide.";

  const valeur = formData.get("pageInteractive");
  const pageInteractive = typeof valeur === "string" && valeur.trim() ? valeur.trim() : null;

  const valeurTitre = formData.get("titreInteractif");
  const titreInteractif = typeof valeurTitre === "string" && valeurTitre.trim() ? valeurTitre.trim() : null;

  const cours = await prisma.cours.findUnique({
    where: { id: coursId },
    select: { id: true, imageCouvertureChemin: true },
  });
  if (!cours) return "Cours introuvable.";

  let imageCouvertureChemin = cours.imageCouvertureChemin;

  // Suppression explicite de l'image
  if (formData.get("supprimerImage") === "on") {
    if (imageCouvertureChemin) {
      await supabaseAdmin.storage.from(BUCKET_IMAGES_COURS).remove([imageCouvertureChemin]);
    }
    imageCouvertureChemin = null;
  }

  // Upload d'une nouvelle image
  const imageFichier = formData.get("imageCouverture");
  if (imageFichier instanceof File && imageFichier.size > 0) {
    try {
      // Supprimer l'ancienne image avant d'uploader la nouvelle
      if (imageCouvertureChemin) {
        await supabaseAdmin.storage.from(BUCKET_IMAGES_COURS).remove([imageCouvertureChemin]);
      }
      imageCouvertureChemin = await televerserImageCouverture(coursId, imageFichier);
    } catch (err) {
      if (err instanceof CoursError) return err.message;
      throw err;
    }
  }

  const correctionVisible = formData.get("correctionVisible") === "on";

  await prisma.cours.update({
    where: { id: coursId },
    data: { pageInteractive, titreInteractif, imageCouvertureChemin, correctionVisible },
  });

  revalidatePath(`/prof/cours/${coursId}`);
  revalidatePath(`/prof/cours/${coursId}/apercu`);
  revalidatePath("/eleve/cours");

  return "Enregistré.";
}

export async function obtenirUrlImageCouverture(chemin: string | null): Promise<string | null> {
  return urlImageCouverture(chemin);
}
