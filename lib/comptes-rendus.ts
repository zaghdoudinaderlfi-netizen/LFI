import { Matiere } from "@prisma/client";
import { auth } from "@/auth";
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

  // La classe vient du compte connecté, pas d'une saisie de l'élève : c'est
  // ce qui permet au prof de filtrer sans dépendre de l'orthographe.
  const session = await auth();
  const eleve = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { classeId: true },
      })
    : null;

  const compteRendu = await prisma.compteRendu.create({
    data: {
      coursId,
      noms: nomsNettoyes,
      travail: travail ?? null,
      classeId: eleve?.classeId ?? null,
    },
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
    include: {
      cours: { select: { titre: true, matiere: true, niveau: true } },
      classe: { select: { nom: true } },
    },
  });
}

export type TriComptesRendus = "date" | "cours";

export type FiltresComptesRendus = {
  tri?: TriComptesRendus;
  matiere?: Matiere;
  classeId?: string;
};

export async function listerComptesRendus({
  tri = "date",
  matiere,
  classeId,
}: FiltresComptesRendus = {}) {
  return prisma.compteRendu.findMany({
    where: {
      ...(matiere ? { cours: { matiere } } : {}),
      ...(classeId ? { classeId } : {}),
    },
    include: {
      cours: { select: { titre: true, matiere: true, niveau: true } },
      classe: { select: { nom: true } },
    },
    orderBy: tri === "cours" ? { cours: { titre: "asc" } } : { dateDepot: "desc" },
  });
}

/** Classes ayant au moins un compte-rendu — pour ne proposer que des filtres utiles. */
export async function listerClassesAvecComptesRendus() {
  const classes = await prisma.classe.findMany({
    where: { comptesRendus: { some: {} } },
    select: { id: true, nom: true, niveau: true },
    orderBy: { nom: "asc" },
  });
  return classes;
}
