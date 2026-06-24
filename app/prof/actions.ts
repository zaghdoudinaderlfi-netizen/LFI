"use server";

import { revalidatePath } from "next/cache";
import { Niveau } from "@prisma/client";
import { auth } from "@/auth";
import { ClasseError, creerClasse } from "@/lib/classes";

export async function creerClasseAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role !== "PROF") {
    return "Accès réservé aux professeurs.";
  }

  const nom = formData.get("nom");
  const niveau = formData.get("niveau");
  const anneeScolaire = formData.get("anneeScolaire");

  if (
    typeof nom !== "string" ||
    typeof niveau !== "string" ||
    typeof anneeScolaire !== "string"
  ) {
    return "Formulaire invalide.";
  }

  if (niveau !== "TROISIEME" && niveau !== "SECONDE" && niveau !== "PREMIERE") {
    return "Niveau invalide.";
  }

  try {
    await creerClasse({ nom, niveau: niveau as Niveau, anneeScolaire });
  } catch (error) {
    if (error instanceof ClasseError) {
      return error.message;
    }
    throw error;
  }

  revalidatePath("/prof");
}
