import { Matiere } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "./prisma";
import { notifierProfs, notifierEleve } from "./notifications";
import { formaterNomComplet } from "./utilisateurs";

export class CompteRenduError extends Error {}

const NOMS_LONGUEUR_MAX = 300;
const TRAVAIL_LONGUEUR_MAX = 200_000;
export const NOTE_ETOILES_MAX = 5;

export type DeposerCompteRenduInput = {
  coursId: string;
  // Repli "hors connexion" : texte libre saisi par l'élève. Ignoré si une
  // session élève avec classe est active (le nom vient alors du compte).
  noms?: string;
  // Coéquipiers choisis dans le widget de recherche — uniquement pris en
  // compte pour un dépôt authentifié, doivent appartenir à la même classe.
  camaradesIds?: string[];
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
 * Élèves de la même classe qu'un élève donné (hors lui-même) — pour le
 * widget de recherche de coéquipiers au moment du dépôt.
 */
export async function listerCamaradesClasse(eleveId: string) {
  const eleve = await prisma.user.findUnique({
    where: { id: eleveId },
    select: { classeId: true },
  });
  if (!eleve?.classeId) return [];

  return prisma.user.findMany({
    where: { classeId: eleve.classeId, role: "ELEVE", NOT: { id: eleveId } },
    select: { id: true, nom: true, prenom: true },
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
  });
}

/**
 * Enregistre le dépôt d'un compte-rendu par un élève (ou un groupe) depuis
 * la page HTML statique d'un cours interactif. Si une session élève est
 * active, l'auteur et ses coéquipiers viennent du compte (pas d'une saisie
 * libre) ; sinon `noms` reste la seule trace, en texte libre.
 */
export async function deposerCompteRendu({
  coursId,
  noms,
  camaradesIds,
  travail,
}: DeposerCompteRenduInput) {
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

  // La classe et l'identité viennent du compte connecté, pas d'une saisie
  // de l'élève : c'est ce qui permet au prof de filtrer et noter sans
  // dépendre de l'orthographe ni d'un nom usurpé.
  const session = await auth();
  const eleve = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, nom: true, prenom: true, classeId: true },
      })
    : null;

  let nomsFinal: string;
  let eleveId: string | null = null;
  let classeId: string | null = null;
  let camaradesValides: string[] = [];

  if (eleve?.classeId) {
    eleveId = eleve.id;
    classeId = eleve.classeId;

    if (camaradesIds?.length) {
      const camarades = await prisma.user.findMany({
        where: {
          id: { in: [...new Set(camaradesIds)] },
          classeId: eleve.classeId,
          role: "ELEVE",
          NOT: { id: eleve.id },
        },
        select: { id: true, nom: true, prenom: true },
      });
      camaradesValides = camarades.map((c) => c.id);
      nomsFinal = [eleve, ...camarades].map(formaterNomComplet).join(", ");
    } else {
      nomsFinal = formaterNomComplet(eleve);
    }
  } else {
    const nomsNettoyes = (noms ?? "").trim();
    if (!nomsNettoyes) {
      throw new CompteRenduError("Le nom (ou les noms) du groupe est obligatoire.");
    }
    if (nomsNettoyes.length > NOMS_LONGUEUR_MAX) {
      throw new CompteRenduError(`Le champ noms est trop long (${NOMS_LONGUEUR_MAX} caractères maximum).`);
    }
    nomsFinal = nomsNettoyes;
  }

  const compteRendu = await prisma.compteRendu.create({
    data: {
      coursId,
      noms: nomsFinal,
      travail: travail ?? null,
      classeId,
      eleveId,
      membres: camaradesValides.length
        ? { create: camaradesValides.map((id) => ({ eleveId: id })) }
        : undefined,
    },
  });

  await notifierProfs(
    `Compte-rendu déposé par ${nomsFinal} — « ${cours.titre} »`,
    `/prof/comptes-rendus/${compteRendu.id}`,
    cours.matiere
  );

  return compteRendu;
}

/** Note en étoiles (0-5) donnée par le prof à un dépôt précis. */
export async function noterCompteRendu(id: string, noteEtoiles: number) {
  if (!Number.isInteger(noteEtoiles) || noteEtoiles < 0 || noteEtoiles > NOTE_ETOILES_MAX) {
    throw new CompteRenduError(`La note doit être un entier entre 0 et ${NOTE_ETOILES_MAX}.`);
  }

  const compteRendu = await prisma.compteRendu.update({
    where: { id },
    data: { noteEtoiles },
    include: {
      cours: { select: { titre: true, matiere: true } },
      membres: { select: { eleveId: true } },
    },
  });

  const destinataires = [
    ...(compteRendu.eleveId ? [compteRendu.eleveId] : []),
    ...compteRendu.membres.map((m) => m.eleveId),
  ];
  await Promise.all(
    destinataires.map((eleveId) =>
      notifierEleve(
        eleveId,
        `Ton compte-rendu « ${compteRendu.cours.titre} » a été noté : ${noteEtoiles}/${NOTE_ETOILES_MAX}`,
        undefined,
        compteRendu.cours.matiere,
        "NOTE"
      )
    )
  );

  return compteRendu;
}

export async function obtenirCompteRendu(id: string) {
  return prisma.compteRendu.findUnique({
    where: { id },
    include: {
      cours: { select: { titre: true, matiere: true, niveau: true } },
      classe: { select: { nom: true } },
      eleve: { select: { nom: true, prenom: true } },
      membres: { include: { eleve: { select: { nom: true, prenom: true } } } },
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
