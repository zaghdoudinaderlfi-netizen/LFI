import { randomUUID } from "crypto";
import { Matiere } from "@prisma/client";
import { prisma } from "./prisma";
import { notifierProfs, notifierEleve } from "./notifications";
import { formaterNomComplet } from "./utilisateurs";
import { MAX_COEQUIPIERS } from "./groupes";
import { supabaseAdmin, BUCKET_COMPTES_RENDUS, assurerBucketPublic } from "./supabase";
import { TAILLE_MAX_OCTETS, EXTENSIONS_DOCUMENTS, extensionDe, nomFichierSur } from "./fichiers";

export class CompteRenduError extends Error {}

const TRAVAIL_LONGUEUR_MAX = 200_000;
export const NOTE_ETOILES_MAX = 5;
// Même plafond que les groupes de devoir (voir lib/groupes.ts) : l'auteur
// plus jusqu'à MAX_COEQUIPIERS camarades, soit 1 à 3 élèves par dépôt.
export { MAX_COEQUIPIERS };

export type DeposerCompteRenduInput = {
  coursId: string;
  // Identité vérifiée côté serveur (session), jamais une saisie libre : un
  // dépôt sans compte permettrait à n'importe qui possédant le lien du
  // cours de déposer sous un nom usurpé.
  eleveId: string;
  // Coéquipiers choisis dans le widget de recherche — doivent appartenir à
  // la même classe que l'auteur. Plafonné à MAX_COEQUIPIERS ci-dessous.
  camaradesIds?: string[];
  travail?: string;
  // Fichier optionnel (ex: document de recherche) — voir televerserFichierCompteRendu.
  fichier?: File;
};

/**
 * Dépose le fichier joint optionnel dans le bucket "comptes-rendus-lfi" et
 * renvoie son URL publique, à stocker dans `CompteRendu.fichierUrl` — même
 * mécanisme que televerserFichierCoursSimple (lib/cours-simple.ts).
 */
export async function televerserFichierCompteRendu(coursId: string, fichier: File): Promise<string> {
  if (fichier.size === 0) {
    throw new CompteRenduError("Le fichier joint est vide.");
  }
  if (fichier.size > TAILLE_MAX_OCTETS) {
    throw new CompteRenduError("Le fichier joint dépasse la taille maximale autorisée (10 Mo).");
  }

  const extension = extensionDe(fichier.name);
  if (!EXTENSIONS_DOCUMENTS.has(extension)) {
    throw new CompteRenduError("Type de fichier non autorisé.");
  }

  await assurerBucketPublic(BUCKET_COMPTES_RENDUS);

  const nomNettoye = nomFichierSur(fichier.name);
  const chemin = `${coursId}/${randomUUID()}-${nomNettoye}`;

  const { error } = await supabaseAdmin.storage.from(BUCKET_COMPTES_RENDUS).upload(chemin, fichier, {
    contentType: fichier.type || "application/octet-stream",
    upsert: false,
  });

  if (error) {
    throw new CompteRenduError("Échec de l'envoi du fichier joint.");
  }

  const { data } = supabaseAdmin.storage.from(BUCKET_COMPTES_RENDUS).getPublicUrl(chemin);
  return data.publicUrl;
}

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
 * la page HTML statique d'un cours interactif. `eleveId` doit être une
 * session vérifiée par l'appelant (route API) — l'identité et la classe
 * viennent toujours du compte, jamais d'une saisie libre.
 */
export async function deposerCompteRendu({
  coursId,
  eleveId: idAuteur,
  camaradesIds,
  travail,
  fichier,
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

  const eleve = await prisma.user.findUnique({
    where: { id: idAuteur },
    select: { id: true, nom: true, prenom: true, classeId: true },
  });
  if (!eleve?.classeId) {
    throw new CompteRenduError("Ton compte n'est rattaché à aucune classe.");
  }

  const eleveId = eleve.id;
  const classeId = eleve.classeId;
  let nomsFinal: string;
  let camaradesValides: string[] = [];

  if (camaradesIds?.length) {
    // Plafonné à MAX_COEQUIPIERS : un dépôt de groupe, pas la classe entière.
    const idsPlafonnes = [...new Set(camaradesIds)].slice(0, MAX_COEQUIPIERS);
    const camarades = await prisma.user.findMany({
      where: {
        id: { in: idsPlafonnes },
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

  const fichierUrl = fichier ? await televerserFichierCompteRendu(coursId, fichier) : null;

  const compteRendu = await prisma.compteRendu.create({
    data: {
      coursId,
      noms: nomsFinal,
      travail: travail ?? null,
      classeId,
      eleveId,
      fichierUrl,
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

/**
 * Supprime un dépôt d'élève. `MembreCompteRendu` part en cascade (voir le
 * schéma) et aucun fichier n'est stocké pour un compte-rendu — le travail
 * est du texte dans la colonne `travail`. Rien d'autre à nettoyer.
 *
 * À savoir : si le dépôt était noté, sa note disparaît de la moyenne du
 * critère « comptes-rendus » de la note orale (voir lib/suivi-oral.ts).
 */
export async function supprimerCompteRendu(id: string) {
  const compteRendu = await prisma.compteRendu.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!compteRendu) throw new CompteRenduError("Compte-rendu introuvable.");

  await prisma.compteRendu.delete({ where: { id } });
}
