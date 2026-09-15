"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { CasierError, deposerFichierEleve, obtenirDocument, supprimerDocument } from "@/lib/casier";

export async function deposerFichierAction(
  _prev: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role !== "ELEVE") return "Accès refusé.";

  const fichier = formData.get("fichier");
  if (!(fichier instanceof File) || fichier.size === 0) return "Sélectionne un fichier.";

  try {
    await deposerFichierEleve(session.user.id, fichier);
  } catch (error) {
    if (error instanceof CasierError) return error.message;
    throw error;
  }

  revalidatePath("/eleve/casier");
  return "Fichier ajouté.";
}

export async function supprimerFichierEleveAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (session?.user?.role !== "ELEVE") return;

  const id = formData.get("id");
  if (typeof id !== "string") return;

  // Un élève ne peut supprimer que ses propres fichiers — jamais un document
  // partagé par le prof (eleveId null) ni le fichier d'un autre élève.
  const doc = await obtenirDocument(id);
  if (!doc || doc.eleveId !== session.user.id) return;

  await supprimerDocument(id);
  revalidatePath("/eleve/casier");
}
