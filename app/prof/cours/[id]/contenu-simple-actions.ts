"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { extraireEmbedVideo } from "@/lib/video";
import {
  CoursSimpleError,
  typeCoursAFichier,
  televerserFichierCoursSimple,
  supprimerFichierCoursSimple,
} from "@/lib/cours-simple";

/**
 * Remplace le contenu d'un cours créé via le formulaire simplifié (5 boutons) :
 * nouveau fichier HTML/PDF/Word, nouveau lien vidéo, ou nouveau quiz associé.
 */
export async function remplacerContenuCoursSimpleAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role !== "PROF") {
    return "Accès réservé aux professeurs.";
  }

  const coursId = formData.get("coursId");
  if (typeof coursId !== "string") {
    return "Formulaire invalide.";
  }

  const cours = await prisma.cours.findUnique({
    where: { id: coursId },
    select: { id: true, typeSimple: true, fichierUrl: true },
  });
  if (!cours || !cours.typeSimple) {
    return "Cours introuvable.";
  }

  try {
    if (typeCoursAFichier(cours.typeSimple)) {
      const fichier = formData.get("fichier");
      if (!(fichier instanceof File) || fichier.size === 0) {
        return "Dépose un fichier.";
      }
      const fichierUrl = await televerserFichierCoursSimple(coursId, fichier, cours.typeSimple);
      await supprimerFichierCoursSimple(cours.fichierUrl);
      await prisma.cours.update({ where: { id: coursId }, data: { fichierUrl } });
    } else if (cours.typeSimple === "VIDEO") {
      const videoUrl = formData.get("videoUrl");
      if (typeof videoUrl !== "string" || !videoUrl.trim()) {
        return "Colle le lien YouTube ou Vimeo de la vidéo.";
      }
      if (!extraireEmbedVideo(videoUrl)) {
        return "Lien YouTube ou Vimeo invalide.";
      }
      await prisma.cours.update({ where: { id: coursId }, data: { videoUrl: videoUrl.trim() } });
    } else if (cours.typeSimple === "QCM") {
      const quizId = formData.get("quizId");
      if (typeof quizId !== "string" || !quizId) {
        return "Choisis un quiz existant.";
      }
      const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, select: { id: true } });
      if (!quiz) {
        return "Quiz introuvable.";
      }
      await prisma.cours.update({ where: { id: coursId }, data: { quizId: quiz.id } });
    }
  } catch (error) {
    if (error instanceof CoursSimpleError) return error.message;
    throw error;
  }

  revalidatePath(`/prof/cours/${coursId}`);
  revalidatePath(`/prof/cours/${coursId}/apercu`);
  revalidatePath("/eleve/cours");

  return "Contenu remplacé.";
}
