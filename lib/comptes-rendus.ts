import { prisma } from "./prisma";
import { notifierProfs } from "./notifications";

export class CompteRenduError extends Error {}

const NOMS_LONGUEUR_MAX = 300;
const TRAVAIL_LONGUEUR_MAX = 200_000;

export type DeposerCompteRenduInput = {
  coursId: string;
  noms: string;
  travail?: string;
};

export type ExerciceRendu = { exercice: string; code: string };

/** Relit le JSON de `travail` ; renvoie [] si absent ou illisible. */
export function lireTravail(travail: string | null): ExerciceRendu[] {
  if (!travail) return [];
  try {
    const donnees = JSON.parse(travail);
    if (!Array.isArray(donnees)) return [];
    return donnees.filter(
      (e): e is ExerciceRendu =>
        typeof e?.exercice === "string" && typeof e?.code === "string"
    );
  } catch {
    return [];
  }
}

/**
 * Enregistre le dépôt d'un compte-rendu par un élève (ou un groupe) depuis
 * la page HTML statique d'un cours interactif. Appelé sans session : la
 * seule protection contre le spam est la validation de `noms`.
 */
export async function deposerCompteRendu({ coursId, noms, travail }: DeposerCompteRenduInput) {
  const nomsNettoyes = noms.trim();

  if (!nomsNettoyes) {
    throw new CompteRenduError("Le nom (ou les noms) du groupe est obligatoire.");
  }
  if (nomsNettoyes.length > NOMS_LONGUEUR_MAX) {
    throw new CompteRenduError(`Le champ noms est trop long (${NOMS_LONGUEUR_MAX} caractères maximum).`);
  }
  if (travail && travail.length > TRAVAIL_LONGUEUR_MAX) {
    throw new CompteRenduError("Le travail joint est trop volumineux.");
  }

  const cours = await prisma.cours.findUnique({
    where: { id: coursId },
    select: { id: true, titre: true, matiere: true },
  });
  if (!cours) {
    throw new CompteRenduError("Cours introuvable.");
  }

  const compteRendu = await prisma.compteRendu.create({
    data: { coursId, noms: nomsNettoyes, travail: travail ?? null },
  });

  await notifierProfs(
    `Compte-rendu déposé par ${nomsNettoyes} — « ${cours.titre} »`,
    `/prof/comptes-rendus/${compteRendu.id}`,
    cours.matiere
  );

  return compteRendu;
}

export async function obtenirCompteRendu(id: string) {
  return prisma.compteRendu.findUnique({
    where: { id },
    include: { cours: { select: { titre: true, matiere: true, niveau: true } } },
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
