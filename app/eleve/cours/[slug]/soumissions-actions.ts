"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { obtenirDevoir } from "@/lib/devoirs";
import { deposerSoumission, SoumissionError } from "@/lib/soumissions";

export async function deposerSoumissionAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role !== "ELEVE") {
    return "Accès réservé aux élèves.";
  }

  const exerciceId = formData.get("exerciceId");
  const slug = formData.get("slug");
  const fichier = formData.get("fichier");

  if (typeof exerciceId !== "string" || typeof slug !== "string") {
    return "Formulaire invalide.";
  }

  if (!(fichier instanceof File) || fichier.size === 0) {
    return "Sélectionne un fichier.";
  }

  const devoir = await obtenirDevoir(exerciceId);
  if (!devoir) {
    return "Devoir introuvable.";
  }

  const [cours, utilisateur] = await Promise.all([
    prisma.cours.findUnique({ where: { id: devoir.coursId } }),
    prisma.user.findUnique({ where: { id: session.user.id }, include: { classe: true } }),
  ]);

  const accesAutorise = cours?.publie && utilisateur?.classe?.niveau === cours.niveau;
  if (!accesAutorise) {
    return "Accès refusé.";
  }

  try {
    await deposerSoumission(exerciceId, session.user.id, fichier);
  } catch (error) {
    if (error instanceof SoumissionError) return error.message;
    throw error;
  }

  revalidatePath(`/eleve/cours/${slug}`);
  return "Devoir déposé.";
}
