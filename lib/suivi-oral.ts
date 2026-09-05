import { Trimestre } from "@prisma/client";
import { prisma } from "./prisma";
import {
  ETOILES_MAX,
  CRITERES,
  type Critere,
  trimestreDeDate,
  trimestreActuel,
  noteSur20,
} from "./suivi-oral-constants";

export class SuiviOralError extends Error {}

export {
  TRIMESTRE_LABELS,
  ETOILES_MAX,
  CRITERES,
  type Critere,
  CRITERE_LABELS,
  trimestreDeDate,
  trimestreActuel,
  noteSur20,
} from "./suivi-oral-constants";

function moyenne0a5(entrees: { travailFait: number; compteRendu: number; assiduite: number }[]) {
  if (entrees.length === 0) return null;
  const somme = entrees.reduce(
    (acc, e) => acc + e.travailFait + e.compteRendu + e.assiduite,
    0
  );
  return somme / (entrees.length * 3);
}

function validerNote(valeur: number, champ: string) {
  if (!Number.isInteger(valeur) || valeur < 0 || valeur > ETOILES_MAX) {
    throw new SuiviOralError(`${champ} doit être un entier entre 0 et ${ETOILES_MAX}.`);
  }
}

export type AjouterEntreeSuiviInput = {
  eleveId: string;
  travailFait: number;
  compteRendu: number;
  assiduite: number;
  commentaire?: string;
};

/** Ajoute un point de suivi pour un élève ; la classe est relevée côté serveur. */
export async function ajouterEntreeSuivi({
  eleveId,
  travailFait,
  compteRendu,
  assiduite,
  commentaire,
}: AjouterEntreeSuiviInput) {
  validerNote(travailFait, "Le score « travail toujours fait »");
  validerNote(compteRendu, "Le score « comptes-rendus »");
  validerNote(assiduite, "Le score « assiduité »");

  const eleve = await prisma.user.findUnique({
    where: { id: eleveId },
    select: { classeId: true, role: true },
  });
  if (!eleve || eleve.role !== "ELEVE") {
    throw new SuiviOralError("Élève introuvable.");
  }
  if (!eleve.classeId) {
    throw new SuiviOralError("Cet élève n'est rattaché à aucune classe.");
  }

  return prisma.entreeSuivi.create({
    data: {
      eleveId,
      classeId: eleve.classeId,
      travailFait,
      compteRendu,
      assiduite,
      commentaire: commentaire?.trim() || null,
    },
  });
}

export async function supprimerEntreeSuivi(id: string) {
  await prisma.entreeSuivi.delete({ where: { id } }).catch(() => null);
}

export type TrimestreSuivi = {
  trimestre: Trimestre;
  entrees: Awaited<ReturnType<typeof listerEntreesEleve>>;
  moyenne0a5: number | null;
  note20: number | null;
  estActuel: boolean;
};

export async function listerEntreesEleve(eleveId: string) {
  return prisma.entreeSuivi.findMany({
    where: { eleveId },
    orderBy: { date: "desc" },
  });
}

/** Regroupe les entrées d'un élève par trimestre, moyenne + note/20 calculées. */
export async function obtenirSuiviEleve(eleveId: string): Promise<TrimestreSuivi[]> {
  const entrees = await listerEntreesEleve(eleveId);
  const actuel = trimestreActuel();

  const parTrimestre = new Map<Trimestre, typeof entrees>();
  for (const trimestre of ["T1", "T2", "T3"] as Trimestre[]) {
    parTrimestre.set(
      trimestre,
      entrees.filter((e) => trimestreDeDate(e.date) === trimestre)
    );
  }

  return (["T1", "T2", "T3"] as Trimestre[])
    .map((trimestre) => {
      const entreesTrimestre = parTrimestre.get(trimestre) ?? [];
      const moyenne = moyenne0a5(entreesTrimestre);
      return {
        trimestre,
        entrees: entreesTrimestre,
        moyenne0a5: moyenne,
        note20: moyenne === null ? null : noteSur20(moyenne),
        estActuel: trimestre === actuel,
      };
    })
    .filter((t) => t.entrees.length > 0 || t.estActuel);
}

/** Vue "en direct" du trimestre en cours pour le tableau de bord élève. */
export async function obtenirScoreLudiqueActuel(eleveId: string) {
  const entrees = await prisma.entreeSuivi.findMany({
    where: { eleveId },
    orderBy: { date: "desc" },
  });
  const actuel = trimestreActuel();
  const entreesTrimestre = entrees.filter((e) => trimestreDeDate(e.date) === actuel);

  if (entreesTrimestre.length === 0) return null;

  const moyenneParCritere = (critere: Critere) =>
    entreesTrimestre.reduce((acc, e) => acc + e[critere], 0) / entreesTrimestre.length;

  return {
    trimestre: actuel,
    nombreEntrees: entreesTrimestre.length,
    moyenne0a5: moyenne0a5(entreesTrimestre)!,
    parCritere: {
      travailFait: moyenneParCritere("travailFait"),
      compteRendu: moyenneParCritere("compteRendu"),
      assiduite: moyenneParCritere("assiduite"),
    },
  };
}

export type EleveAvecMoyenne = {
  id: string;
  nom: string;
  prenom: string | null;
  moyenne0a5: number | null;
  nombreEntrees: number;
};

/** Pour la page prof : élèves d'une classe avec leur moyenne du trimestre choisi. */
export async function listerElevesAvecSuiviClasse(
  classeId: string,
  trimestre: Trimestre
): Promise<EleveAvecMoyenne[]> {
  const eleves = await prisma.user.findMany({
    where: { classeId, role: "ELEVE" },
    select: {
      id: true,
      nom: true,
      prenom: true,
      entreesSuivi: { select: { date: true, travailFait: true, compteRendu: true, assiduite: true } },
    },
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
  });

  return eleves.map((eleve) => {
    const entreesTrimestre = eleve.entreesSuivi.filter((e) => trimestreDeDate(e.date) === trimestre);
    return {
      id: eleve.id,
      nom: eleve.nom,
      prenom: eleve.prenom,
      moyenne0a5: moyenne0a5(entreesTrimestre),
      nombreEntrees: entreesTrimestre.length,
    };
  });
}
