"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { obtenirDevoir, obtenirChampsFormulaireDevoir } from "@/lib/devoirs";
import { deposerSoumissionFormulaire, SoumissionError } from "@/lib/soumissions";
import { PREFIXE_CHAMP_FORMULAIRE } from "@/lib/formulaire-champs";
import { NOM_CHAMP_COEQUIPIERS } from "@/lib/groupes";

export async function soumettreFormulaireAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role !== "ELEVE") {
    return "Accès réservé aux élèves.";
  }

  const exerciceId = formData.get("exerciceId");
  const slug = formData.get("slug");

  if (typeof exerciceId !== "string" || typeof slug !== "string") {
    return "Formulaire invalide.";
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

  const champs = await obtenirChampsFormulaireDevoir(devoir);
  if (champs.length === 0) {
    return "Ce devoir n'a pas (encore) de formulaire à remplir.";
  }

  const reponses: Record<string, string | boolean> = {};
  for (const champ of champs) {
    if (champ.type === "case") {
      reponses[champ.nom] = formData.has(`${PREFIXE_CHAMP_FORMULAIRE}${champ.nom}`);
    } else {
      const valeur = formData.get(`${PREFIXE_CHAMP_FORMULAIRE}${champ.nom}`);
      reponses[champ.nom] = typeof valeur === "string" ? valeur : "";
    }
  }

  const coequipierIds = formData.getAll(NOM_CHAMP_COEQUIPIERS).filter((v) => typeof v === "string") as string[];

  try {
    await deposerSoumissionFormulaire(exerciceId, session.user.id, reponses, coequipierIds);
  } catch (error) {
    if (error instanceof SoumissionError) return error.message;
    throw error;
  }

  revalidatePath(`/eleve/cours/${slug}`);
  return "Formulaire envoyé.";
}
