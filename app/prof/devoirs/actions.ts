"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { noterSoumission, SoumissionError } from "@/lib/soumissions";

export async function noterSoumissionAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role !== "PROF") {
    return "Accès réservé aux professeurs.";
  }

  const id = formData.get("id");
  const note = formData.get("note");
  const feedback = formData.get("feedback");

  if (typeof id !== "string" || typeof note !== "string") {
    return "Formulaire invalide.";
  }

  const noteValeur = Number(note);
  if (!Number.isFinite(noteValeur)) {
    return "La note doit être un nombre.";
  }

  try {
    await noterSoumission(id, {
      note: noteValeur,
      feedback: typeof feedback === "string" ? feedback : undefined,
    });
  } catch (error) {
    if (error instanceof SoumissionError) return error.message;
    throw error;
  }

  revalidatePath("/prof/devoirs");
  revalidatePath("/prof");
  return "Copie corrigée.";
}
