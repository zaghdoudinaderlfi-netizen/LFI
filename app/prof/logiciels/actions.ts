"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  ajouterFichierLogiciel,
  ajouterLogiciel,
  deplacerLogiciel,
  LogicielError,
  modifierLogiciel,
  supprimerFichierLogiciel,
  supprimerLogiciel,
} from "@/lib/logiciels";

async function verifierProf() {
  const session = await auth();
  return session?.user?.role === "PROF";
}

export async function ajouterLogicielAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  if (!(await verifierProf())) return "Accès réservé aux professeurs.";

  const titre = formData.get("titre");
  const description = formData.get("description");
  const lien = formData.get("lien");
  const fichier = formData.get("fichier");

  if (typeof titre !== "string" || typeof description !== "string" || typeof lien !== "string") {
    return "Formulaire invalide.";
  }

  try {
    await ajouterLogiciel({
      titre,
      description,
      lien,
      fichier: fichier instanceof File ? fichier : null,
    });
  } catch (error) {
    if (error instanceof LogicielError) return error.message;
    throw error;
  }

  revalidatePath("/prof/logiciels");
  revalidatePath("/eleve/logiciels");
  return "Logiciel ajouté.";
}

export async function modifierLogicielAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  if (!(await verifierProf())) return "Accès réservé aux professeurs.";

  const id = formData.get("id");
  const titre = formData.get("titre");
  const description = formData.get("description");
  const lien = formData.get("lien");

  if (
    typeof id !== "string" ||
    typeof titre !== "string" ||
    typeof description !== "string" ||
    typeof lien !== "string"
  ) {
    return "Formulaire invalide.";
  }

  try {
    await modifierLogiciel(id, { titre, description, lien });
  } catch (error) {
    if (error instanceof LogicielError) return error.message;
    throw error;
  }

  revalidatePath("/prof/logiciels");
  revalidatePath("/eleve/logiciels");
  return "Modifications enregistrées.";
}

export async function ajouterFichierLogicielAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  if (!(await verifierProf())) return "Accès réservé aux professeurs.";

  const id = formData.get("id");
  const fichier = formData.get("fichier");

  if (typeof id !== "string" || !(fichier instanceof File) || fichier.size === 0) {
    return "Choisis un fichier.";
  }

  try {
    await ajouterFichierLogiciel(id, fichier);
  } catch (error) {
    if (error instanceof LogicielError) return error.message;
    throw error;
  }

  revalidatePath("/prof/logiciels");
  revalidatePath("/eleve/logiciels");
  return "Fichier ajouté.";
}

export async function supprimerFichierLogicielAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  if (!(await verifierProf())) return "Accès réservé aux professeurs.";

  const id = formData.get("id");
  if (typeof id !== "string") return "Formulaire invalide.";

  try {
    await supprimerFichierLogiciel(id);
  } catch (error) {
    if (error instanceof LogicielError) return error.message;
    throw error;
  }

  revalidatePath("/prof/logiciels");
  revalidatePath("/eleve/logiciels");
  return "Fichier retiré.";
}

export async function supprimerLogicielAction(formData: FormData) {
  if (!(await verifierProf())) return;

  const id = formData.get("id");
  if (typeof id !== "string") return;

  await supprimerLogiciel(id);

  revalidatePath("/prof/logiciels");
  revalidatePath("/eleve/logiciels");
}

export async function deplacerLogicielAction(formData: FormData) {
  if (!(await verifierProf())) return;

  const id = formData.get("id");
  const direction = formData.get("direction");
  if (typeof id !== "string" || (direction !== "haut" && direction !== "bas")) return;

  await deplacerLogiciel(id, direction);

  revalidatePath("/prof/logiciels");
  revalidatePath("/eleve/logiciels");
}
