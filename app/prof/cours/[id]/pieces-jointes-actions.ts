"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { ajouterPieceJointe, supprimerPieceJointe, PieceJointeError } from "@/lib/pieces-jointes";

export async function ajouterPieceJointeAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role !== "PROF") {
    return "Accès réservé aux professeurs.";
  }

  const coursId = formData.get("coursId");
  const fichier = formData.get("fichier");

  if (typeof coursId !== "string") {
    return "Formulaire invalide.";
  }

  if (!(fichier instanceof File) || fichier.size === 0) {
    return "Sélectionne un fichier.";
  }

  try {
    await ajouterPieceJointe(coursId, fichier);
  } catch (error) {
    if (error instanceof PieceJointeError) return error.message;
    throw error;
  }

  revalidatePath(`/prof/cours/${coursId}`);
  revalidatePath(`/prof/cours/${coursId}/apercu`);
  return "Fichier ajouté.";
}

export async function supprimerPieceJointeAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (session?.user?.role !== "PROF") {
    return;
  }

  const id = formData.get("id");
  const coursId = formData.get("coursId");

  if (typeof id !== "string" || typeof coursId !== "string") {
    return;
  }

  await supprimerPieceJointe(id);

  revalidatePath(`/prof/cours/${coursId}`);
  revalidatePath(`/prof/cours/${coursId}/apercu`);
}
