"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { ajouterEntreeSuivi, supprimerEntreeSuivi, SuiviOralError } from "@/lib/suivi-oral";

function nombreEntier(formData: FormData, champ: string): number {
  const valeur = formData.get(champ);
  return typeof valeur === "string" ? Number.parseInt(valeur, 10) : NaN;
}

export async function ajouterEntreeSuiviAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role !== "PROF") {
    return "Accès réservé aux professeurs.";
  }

  const eleveId = formData.get("eleveId");
  const classeId = formData.get("classeId");
  const commentaire = formData.get("commentaire");

  if (typeof eleveId !== "string" || typeof classeId !== "string") {
    return "Formulaire invalide.";
  }

  try {
    await ajouterEntreeSuivi({
      eleveId,
      travailFait: nombreEntier(formData, "travailFait"),
      assiduite: nombreEntier(formData, "assiduite"),
      commentaire: typeof commentaire === "string" ? commentaire : undefined,
    });
  } catch (error) {
    if (error instanceof SuiviOralError) {
      return error.message;
    }
    throw error;
  }

  revalidatePath(`/prof/classes/${classeId}/suivi`);
  revalidatePath(`/prof/classes/${classeId}/suivi/${eleveId}`);
}

export async function supprimerEntreeSuiviAction(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "PROF") return;

  const id = formData.get("id");
  const classeId = formData.get("classeId");
  const eleveId = formData.get("eleveId");
  if (typeof id !== "string") return;

  await supprimerEntreeSuivi(id);

  if (typeof classeId === "string" && typeof eleveId === "string") {
    revalidatePath(`/prof/classes/${classeId}/suivi`);
    revalidatePath(`/prof/classes/${classeId}/suivi/${eleveId}`);
  }
}
