"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { estNomPageValide } from "@/lib/cours-interactif";

export async function modifierPageInteractiveAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role !== "PROF") return "Accès réservé aux professeurs.";

  const coursId = formData.get("coursId");
  if (typeof coursId !== "string") return "Formulaire invalide.";

  // Le champ peut venir d'une saisie libre quand la liste des fichiers n'a pas
  // pu être construite : on refuse tout ce que /cours/[fichier] refuserait de
  // servir, plutôt que d'enregistrer une association qui ne marchera jamais.
  const valeur = formData.get("pageInteractive");
  const pageInteractive = typeof valeur === "string" && valeur.trim() ? valeur.trim() : null;
  if (pageInteractive !== null && !estNomPageValide(pageInteractive)) {
    return "Nom de fichier invalide (attendu : minuscules, chiffres, tirets, se terminant par .html).";
  }

  const valeurTitre = formData.get("titreInteractif");
  const titreInteractif = typeof valeurTitre === "string" && valeurTitre.trim() ? valeurTitre.trim() : null;

  const cours = await prisma.cours.findUnique({ where: { id: coursId }, select: { id: true } });
  if (!cours) return "Cours introuvable.";

  await prisma.cours.update({
    where: { id: coursId },
    data: { pageInteractive, titreInteractif },
  });

  revalidatePath(`/prof/cours/${coursId}`);
  revalidatePath(`/prof/cours/${coursId}/apercu`);
  revalidatePath("/eleve/cours");

  return "Enregistré.";
}
