"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { creerAnnonce, desactiverAnnonce, reactiverAnnonce, supprimerAnnonce, AnnonceError } from "@/lib/annonces";

async function idProf() {
  const session = await auth();
  if (session?.user?.role !== "PROF") return null;
  return session.user.id;
}

export async function creerAnnonceAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const auteurId = await idProf();
  if (!auteurId) return "Accès réservé aux professeurs.";

  const message = formData.get("message");
  const fichier = formData.get("fichier");

  if (typeof message !== "string") {
    return "Formulaire invalide.";
  }

  try {
    await creerAnnonce({
      auteurId,
      message,
      fichier: fichier instanceof File ? fichier : null,
    });
  } catch (error) {
    if (error instanceof AnnonceError) return error.message;
    throw error;
  }

  revalidatePath("/prof/annonce");
  revalidatePath("/eleve");
}

export async function desactiverAnnonceAction(formData: FormData) {
  if (!(await idProf())) return;
  const id = formData.get("id");
  if (typeof id !== "string") return;
  await desactiverAnnonce(id);
  revalidatePath("/prof/annonce");
  revalidatePath("/eleve");
}

export async function reactiverAnnonceAction(formData: FormData) {
  if (!(await idProf())) return;
  const id = formData.get("id");
  if (typeof id !== "string") return;
  await reactiverAnnonce(id);
  revalidatePath("/prof/annonce");
  revalidatePath("/eleve");
}

export async function supprimerAnnonceAction(formData: FormData) {
  if (!(await idProf())) return;
  const id = formData.get("id");
  if (typeof id !== "string") return;
  await supprimerAnnonce(id);
  revalidatePath("/prof/annonce");
  revalidatePath("/eleve");
}
