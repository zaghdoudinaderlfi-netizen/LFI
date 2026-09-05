import { Trimestre } from "@prisma/client";
import { prisma } from "./prisma";
import {
  ETOILES_MAX,
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

/** Moyenne d'une liste de notes /5, ou null si la liste est vide. */
function moyenneListe(valeurs: number[]): number | null {
  if (valeurs.length === 0) return null;
  return valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
}

/** Moyenne des 3 critères disponibles (ignore ceux à null), ou null si aucun. */
function moyenneComposantes(composantes: (number | null)[]): number | null {
  const dispo = composantes.filter((v): v is number => v !== null);
  return dispo.length ? dispo.reduce((a, b) => a + b, 0) / dispo.length : null;
}

function validerNote(valeur: number, champ: string) {
  if (!Number.isInteger(valeur) || valeur < 0 || valeur > ETOILES_MAX) {
    throw new SuiviOralError(`${champ} doit être un entier entre 0 et ${ETOILES_MAX}.`);
  }
}

export type AjouterEntreeSuiviInput = {
  eleveId: string;
  travailFait: number;
  assiduite: number;
  commentaire?: string;
};

/**
 * Ajoute un point de suivi "travail fait / assiduité" pour un élève ; la
 * classe est relevée côté serveur. Le critère "comptes-rendus" n'est pas
 * saisi ici — voir noterCompteRendu() dans lib/comptes-rendus.ts.
 */
export async function ajouterEntreeSuivi({
  eleveId,
  travailFait,
  assiduite,
  commentaire,
}: AjouterEntreeSuiviInput) {
  validerNote(travailFait, "Le score « travail toujours fait »");
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
      assiduite,
      commentaire: commentaire?.trim() || null,
    },
  });
}

export async function supprimerEntreeSuivi(id: string) {
  await prisma.entreeSuivi.delete({ where: { id } }).catch(() => null);
}

export async function listerEntreesEleve(eleveId: string) {
  return prisma.entreeSuivi.findMany({
    where: { eleveId },
    orderBy: { date: "desc" },
  });
}

/** Comptes-rendus (déposés seul ou en groupe) déjà notés par le prof. */
async function listerComptesRendusNotesEleve(eleveId: string) {
  return prisma.compteRendu.findMany({
    where: {
      noteEtoiles: { not: null },
      OR: [{ eleveId }, { membres: { some: { eleveId } } }],
    },
    select: {
      id: true,
      dateDepot: true,
      noteEtoiles: true,
      noms: true,
      cours: { select: { titre: true } },
    },
    orderBy: { dateDepot: "desc" },
  });
}

export type TrimestreSuivi = {
  trimestre: Trimestre;
  entrees: Awaited<ReturnType<typeof listerEntreesEleve>>;
  comptesRendus: Awaited<ReturnType<typeof listerComptesRendusNotesEleve>>;
  travailFaitAvg: number | null;
  compteRenduAvg: number | null;
  assiduiteAvg: number | null;
  moyenne0a5: number | null;
  note20: number | null;
  estActuel: boolean;
};

/**
 * Regroupe par trimestre le suivi manuel (travail fait / assiduité) et les
 * comptes-rendus notés (critère "comptes-rendus") d'un élève, avec la
 * moyenne des 3 composantes disponibles et la note orale /20 qui en découle.
 */
export async function obtenirSuiviEleve(eleveId: string): Promise<TrimestreSuivi[]> {
  const [entrees, comptesRendus] = await Promise.all([
    listerEntreesEleve(eleveId),
    listerComptesRendusNotesEleve(eleveId),
  ]);
  const actuel = trimestreActuel();

  return (["T1", "T2", "T3"] as Trimestre[])
    .map((trimestre) => {
      const entreesTrimestre = entrees.filter((e) => trimestreDeDate(e.date) === trimestre);
      const comptesRendusTrimestre = comptesRendus.filter((cr) => trimestreDeDate(cr.dateDepot) === trimestre);

      const travailFaitAvg = moyenneListe(entreesTrimestre.map((e) => e.travailFait));
      const assiduiteAvg = moyenneListe(entreesTrimestre.map((e) => e.assiduite));
      const compteRenduAvg = moyenneListe(comptesRendusTrimestre.map((cr) => cr.noteEtoiles!));

      const moyenne = moyenneComposantes([travailFaitAvg, compteRenduAvg, assiduiteAvg]);

      return {
        trimestre,
        entrees: entreesTrimestre,
        comptesRendus: comptesRendusTrimestre,
        travailFaitAvg,
        compteRenduAvg,
        assiduiteAvg,
        moyenne0a5: moyenne,
        note20: moyenne === null ? null : noteSur20(moyenne),
        estActuel: trimestre === actuel,
      };
    })
    .filter((t) => t.entrees.length > 0 || t.comptesRendus.length > 0 || t.estActuel);
}

/** Vue "en direct" du trimestre en cours pour le tableau de bord élève. */
export async function obtenirScoreLudiqueActuel(eleveId: string) {
  const actuel = trimestreActuel();
  const [entrees, comptesRendus] = await Promise.all([
    listerEntreesEleve(eleveId),
    listerComptesRendusNotesEleve(eleveId),
  ]);
  const entreesTrimestre = entrees.filter((e) => trimestreDeDate(e.date) === actuel);
  const comptesRendusTrimestre = comptesRendus.filter((cr) => trimestreDeDate(cr.dateDepot) === actuel);

  const travailFaitAvg = moyenneListe(entreesTrimestre.map((e) => e.travailFait));
  const assiduiteAvg = moyenneListe(entreesTrimestre.map((e) => e.assiduite));
  const compteRenduAvg = moyenneListe(comptesRendusTrimestre.map((cr) => cr.noteEtoiles!));
  const moyenne = moyenneComposantes([travailFaitAvg, compteRenduAvg, assiduiteAvg]);

  if (moyenne === null) return null;

  return {
    trimestre: actuel,
    nombreEntrees: entreesTrimestre.length + comptesRendusTrimestre.length,
    moyenne0a5: moyenne,
    parCritere: {
      travailFait: travailFaitAvg ?? 0,
      compteRendu: compteRenduAvg ?? 0,
      assiduite: assiduiteAvg ?? 0,
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
      entreesSuivi: { select: { date: true, travailFait: true, assiduite: true } },
      comptesRendus: { select: { dateDepot: true, noteEtoiles: true } },
      comptesRendusMembre: {
        select: { compteRendu: { select: { dateDepot: true, noteEtoiles: true } } },
      },
    },
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
  });

  return eleves.map((eleve) => {
    const entreesTrimestre = eleve.entreesSuivi.filter((e) => trimestreDeDate(e.date) === trimestre);

    const comptesRendusNotes = [
      ...eleve.comptesRendus,
      ...eleve.comptesRendusMembre.map((m) => m.compteRendu),
    ].filter((cr) => cr.noteEtoiles !== null && trimestreDeDate(cr.dateDepot) === trimestre);

    const travailFaitAvg = moyenneListe(entreesTrimestre.map((e) => e.travailFait));
    const assiduiteAvg = moyenneListe(entreesTrimestre.map((e) => e.assiduite));
    const compteRenduAvg = moyenneListe(comptesRendusNotes.map((cr) => cr.noteEtoiles!));
    const moyenne = moyenneComposantes([travailFaitAvg, compteRenduAvg, assiduiteAvg]);

    return {
      id: eleve.id,
      nom: eleve.nom,
      prenom: eleve.prenom,
      moyenne0a5: moyenne,
      nombreEntrees: entreesTrimestre.length + comptesRendusNotes.length,
    };
  });
}
