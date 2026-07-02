"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  QuizError,
  ajouterQuestion,
  supprimerQuestion,
  parserQuestionsCSV,
  importerQuestions,
  type LigneImportValide,
  type ResultatImportCSV,
} from "@/lib/quiz";

export async function ajouterQuestionAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role !== "PROF") {
    return "Accès réservé aux professeurs.";
  }

  const quizId = formData.get("quizId");
  const enonce = formData.get("enonce");
  const choixA = formData.get("choixA");
  const choixB = formData.get("choixB");
  const choixC = formData.get("choixC");
  const choixD = formData.get("choixD");
  const bonneReponse = formData.get("bonneReponse");
  const tempsLimiteSec = formData.get("tempsLimiteSec");

  if (
    typeof quizId !== "string" ||
    typeof enonce !== "string" ||
    typeof choixA !== "string" ||
    typeof choixB !== "string" ||
    typeof choixC !== "string" ||
    typeof choixD !== "string" ||
    typeof bonneReponse !== "string" ||
    typeof tempsLimiteSec !== "string"
  ) {
    return "Formulaire invalide.";
  }

  try {
    await ajouterQuestion(quizId, {
      enonce,
      choixA,
      choixB,
      choixC,
      choixD,
      bonneReponse: Number(bonneReponse),
      tempsLimiteSec: Number(tempsLimiteSec),
    });
  } catch (error) {
    if (error instanceof QuizError) return error.message;
    throw error;
  }

  revalidatePath(`/prof/quiz/${quizId}`);
  return "Question ajoutée.";
}

export async function supprimerQuestionAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (session?.user?.role !== "PROF") return;

  const id = formData.get("id");
  const quizId = formData.get("quizId");
  if (typeof id !== "string" || typeof quizId !== "string") return;

  await supprimerQuestion(id);

  revalidatePath(`/prof/quiz/${quizId}`);
}

export async function previewImportQuestionsAction(texte: string): Promise<ResultatImportCSV> {
  const session = await auth();
  if (session?.user?.role !== "PROF") {
    return { valides: [], invalides: [] };
  }

  return parserQuestionsCSV(texte);
}

export async function confirmerImportQuestionsAction(
  quizId: string,
  lignes: LigneImportValide[]
): Promise<string> {
  const session = await auth();
  if (session?.user?.role !== "PROF") {
    return "Accès réservé aux professeurs.";
  }

  let nb: number;
  try {
    nb = await importerQuestions(quizId, lignes);
  } catch (error) {
    if (error instanceof QuizError) return error.message;
    throw error;
  }

  revalidatePath(`/prof/quiz/${quizId}`);
  return `${nb} question${nb > 1 ? "s" : ""} importée${nb > 1 ? "s" : ""}.`;
}
