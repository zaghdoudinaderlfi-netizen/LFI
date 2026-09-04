import { prisma } from "./prisma";

export class CompteRenduError extends Error {}

const NOMS_LONGUEUR_MAX = 300;

export type DeposerCompteRenduInput = {
  coursId: string;
  noms: string;
};

/**
 * Enregistre le dépôt d'un compte-rendu par un élève (ou un groupe) depuis
 * la page HTML statique d'un cours interactif. Appelé sans session : la
 * seule protection contre le spam est la validation de `noms`.
 */
export async function deposerCompteRendu({ coursId, noms }: DeposerCompteRenduInput) {
  const nomsNettoyes = noms.trim();

  if (!nomsNettoyes) {
    throw new CompteRenduError("Le nom (ou les noms) du groupe est obligatoire.");
  }
  if (nomsNettoyes.length > NOMS_LONGUEUR_MAX) {
    throw new CompteRenduError(`Le champ noms est trop long (${NOMS_LONGUEUR_MAX} caractères maximum).`);
  }

  const cours = await prisma.cours.findUnique({
    where: { id: coursId },
    select: { id: true },
  });
  if (!cours) {
    throw new CompteRenduError("Cours introuvable.");
  }

  return prisma.compteRendu.create({
    data: { coursId, noms: nomsNettoyes },
  });
}

export type TriComptesRendus = "date" | "cours";

export async function listerComptesRendus(tri: TriComptesRendus = "date") {
  return prisma.compteRendu.findMany({
    include: { cours: { select: { titre: true, matiere: true, niveau: true } } },
    orderBy:
      tri === "cours"
        ? { cours: { titre: "asc" } }
        : { dateDepot: "desc" },
  });
}
