import { AvisFeedback } from "@prisma/client";
import { prisma } from "./prisma";

export class FeedbackError extends Error {}

/**
 * Enregistre l'avis d'un élève sur un cours — une seule fois par élève et
 * par cours (voir la contrainte d'unicité sur CoursFeedback). Un second
 * essai sur un cours déjà noté échoue plutôt que d'écraser l'avis existant :
 * ce n'est pas un sondage qu'on peut refaire.
 */
export async function enregistrerFeedback({
  eleveId,
  coursId,
  avis,
}: {
  eleveId: string;
  coursId: string;
  avis: AvisFeedback;
}) {
  const existant = await prisma.coursFeedback.findUnique({
    where: { eleveId_coursId: { eleveId, coursId } },
  });
  if (existant) {
    throw new FeedbackError("Tu as déjà donné ton avis sur ce cours.");
  }

  return prisma.coursFeedback.create({
    data: { eleveId, coursId, avis },
  });
}

export async function obtenirFeedbackEleve(eleveId: string, coursId: string) {
  return prisma.coursFeedback.findUnique({
    where: { eleveId_coursId: { eleveId, coursId } },
    select: { avis: true },
  });
}

export type CompteursFeedback = { positifs: number; negatifs: number };

/** Nombre de 😊 et de 😕 reçus, pour chaque cours d'une liste — une seule requête. */
export async function compterFeedbacksParCours(coursIds: string[]): Promise<Map<string, CompteursFeedback>> {
  const groupes = await prisma.coursFeedback.groupBy({
    by: ["coursId", "avis"],
    where: { coursId: { in: coursIds } },
    _count: { _all: true },
  });

  const compteurs = new Map<string, CompteursFeedback>();
  for (const g of groupes) {
    const existant = compteurs.get(g.coursId) ?? { positifs: 0, negatifs: 0 };
    if (g.avis === "POSITIF") existant.positifs = g._count._all;
    else existant.negatifs = g._count._all;
    compteurs.set(g.coursId, existant);
  }
  return compteurs;
}
