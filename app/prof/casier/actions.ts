"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { estMatiereValide } from "@/lib/classes-constants";
import { CasierError, partagerDocumentMatiere, supprimerDocument } from "@/lib/casier";

export async function partagerDocumentAction(
  _prev: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role !== "PROF") return "Accès refusé.";

  const matiere = formData.get("matiere");
  const fichier = formData.get("fichier");

  if (typeof matiere !== "string" || !estMatiereValide(matiere)) return "Matière invalide.";
  if (!(fichier instanceof File) || fichier.size === 0) return "Sélectionne un fichier.";

  try {
    await partagerDocumentMatiere(session.user.id, matiere, fichier);
  } catch (error) {
    if (error instanceof CasierError) return error.message;
    throw error;
  }

  revalidatePath("/prof/casier");
  return "Document partagé.";
}

export async function supprimerDocumentProfAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (session?.user?.role !== "PROF") return;

  const id = formData.get("id");
  if (typeof id !== "string") return;

  await supprimerDocument(id);
  revalidatePath("/prof/casier");
}
