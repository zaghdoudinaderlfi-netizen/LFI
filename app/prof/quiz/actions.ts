"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Matiere, Niveau } from "@prisma/client";
import { auth } from "@/auth";
import { QuizError, creerQuiz, modifierQuiz, supprimerQuiz, basculerVisibiliteQuiz } from "@/lib/quiz";

function lireInfosFormulaire(formData: FormData) {
  const titre = formData.get("titre");
  const niveau = formData.get("niveau");
  const matiere = formData.get("matiere");
  const visibleEleves = formData.get("visibleEleves") === "on";
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
    visibleEleves,
    chapitre,
  };
}

export async function creerQuizAction(
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

  let quiz;
  try {
    quiz = await creerQuiz(session.user.id, infos);
  } catch (error) {
    if (error instanceof QuizError) return error.message;
    throw error;
  }

  revalidatePath("/prof/quiz");
  redirect(`/prof/quiz/${quiz.id}`);
}

export async function modifierQuizAction(
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
    await modifierQuiz(id, infos);
  } catch (error) {
    if (error instanceof QuizError) return error.message;
    throw error;
  }

  revalidatePath("/prof/quiz");
  revalidatePath(`/prof/quiz/${id}`);

  return "Quiz enregistré.";
}

export async function basculerVisibiliteQuizAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (session?.user?.role !== "PROF") return;

  const id = formData.get("quizId");
  const visible = formData.get("visible") === "true";
  if (typeof id !== "string") return;

  try {
    await basculerVisibiliteQuiz(id, visible);
  } catch (error) {
    if (error instanceof QuizError) return;
    throw error;
  }

  revalidatePath("/prof/quiz");
  revalidatePath("/eleve/quiz");
}

export async function supprimerQuizAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (session?.user?.role !== "PROF") return;

  const id = formData.get("quizId");
  if (typeof id !== "string") return;

  try {
    await supprimerQuiz(id);
  } catch (error) {
    if (error instanceof QuizError) return;
    throw error;
  }

  revalidatePath("/prof/quiz");
  redirect("/prof/quiz");
}
