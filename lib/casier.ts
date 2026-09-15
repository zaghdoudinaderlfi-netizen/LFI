// Casier numérique : documents partagés par le prof pour toute une matière,
// et fichiers personnels déposés par les élèves. Même pattern de stockage
// que lib/pieces-jointes.ts (Supabase Storage, bucket privé, URL signée).

import { randomUUID } from "crypto";
import type { Matiere } from "@prisma/client";
import { prisma } from "./prisma";
import { supabaseAdmin, assurerBucketPrive, BUCKET_CASIER } from "./supabase";
import { TAILLE_MAX_OCTETS, nomFichierSur, extensionDe } from "./fichiers";
import { MATIERE_PAR_NIVEAU } from "./classes-constants";

export class CasierError extends Error {}

const EXTENSIONS_AUTORISEES = new Set([
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "txt",
  "csv",
  "zip",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "py",
  "ino",
]);

function validerFichier(fichier: File) {
  if (fichier.size === 0) {
    throw new CasierError("Le fichier est vide.");
  }
  if (fichier.size > TAILLE_MAX_OCTETS) {
    throw new CasierError("Le fichier dépasse la taille maximale autorisée (10 Mo).");
  }
  if (!EXTENSIONS_AUTORISEES.has(extensionDe(fichier.name))) {
    throw new CasierError("Type de fichier non autorisé.");
  }
}

async function envoyerVersStockage(chemin: string, fichier: File) {
  await assurerBucketPrive(BUCKET_CASIER);
  const { error } = await supabaseAdmin.storage.from(BUCKET_CASIER).upload(chemin, fichier, {
    contentType: fichier.type || "application/octet-stream",
    upsert: false,
  });
  if (error) {
    throw new CasierError("Échec de l'envoi du fichier.");
  }
}

/** Dépose un fichier personnel d'élève — matière déduite de sa classe. */
export async function deposerFichierEleve(eleveId: string, fichier: File, dossierId?: string | null) {
  validerFichier(fichier);

  const eleve = await prisma.user.findUnique({
    where: { id: eleveId, role: "ELEVE" },
    select: { classe: { select: { niveau: true } } },
  });
  if (!eleve?.classe) {
    throw new CasierError("Tu dois être rattaché à une classe pour utiliser le casier.");
  }
  const matiere = MATIERE_PAR_NIVEAU[eleve.classe.niveau];

  const nomNettoye = nomFichierSur(fichier.name);
  const chemin = `eleves/${eleveId}/${randomUUID()}-${nomNettoye}`;
  await envoyerVersStockage(chemin, fichier);

  try {
    return await prisma.documentCasier.create({
      data: {
        nom: fichier.name,
        chemin,
        taille: fichier.size,
        typeMime: fichier.type || "application/octet-stream",
        matiere,
        eleveId,
        auteurId: eleveId,
        dossierId: dossierId ?? null,
      },
    });
  } catch (err) {
    await supabaseAdmin.storage.from(BUCKET_CASIER).remove([chemin]);
    throw err;
  }
}

/** Partage un document par le prof, visible par tous les élèves de la matière. */
export async function partagerDocumentMatiere(
  profId: string,
  matiere: Matiere,
  fichier: File,
  dossierId?: string | null
) {
  validerFichier(fichier);

  const nomNettoye = nomFichierSur(fichier.name);
  const chemin = `matieres/${matiere}/${randomUUID()}-${nomNettoye}`;
  await envoyerVersStockage(chemin, fichier);

  try {
    return await prisma.documentCasier.create({
      data: {
        nom: fichier.name,
        chemin,
        taille: fichier.size,
        typeMime: fichier.type || "application/octet-stream",
        matiere,
        eleveId: null,
        auteurId: profId,
        dossierId: dossierId ?? null,
      },
    });
  } catch (err) {
    await supabaseAdmin.storage.from(BUCKET_CASIER).remove([chemin]);
    throw err;
  }
}

export async function listerDocumentsPartages(matiere: Matiere) {
  return prisma.documentCasier.findMany({
    where: { matiere, eleveId: null },
    orderBy: { createdAt: "desc" },
  });
}

export async function listerFichiersEleve(eleveId: string) {
  return prisma.documentCasier.findMany({
    where: { eleveId },
    orderBy: { createdAt: "desc" },
  });
}

/** Pour le prof : tous les fichiers déposés par les élèves d'une matière. */
export async function listerFichiersElevesParMatiere(matiere: Matiere) {
  return prisma.documentCasier.findMany({
    where: { matiere, eleveId: { not: null } },
    include: {
      eleve: { select: { nom: true, prenom: true, classe: { select: { nom: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function obtenirDocument(id: string) {
  return prisma.documentCasier.findUnique({ where: { id } });
}

/** Supprime un document — jamais confiance en un id : vérifie l'accès avant l'appel. */
export async function supprimerDocument(id: string) {
  const doc = await prisma.documentCasier.findUnique({ where: { id } });
  if (!doc) {
    throw new CasierError("Document introuvable.");
  }

  await supabaseAdmin.storage.from(BUCKET_CASIER).remove([doc.chemin]);
  await prisma.documentCasier.delete({ where: { id } });
  return doc;
}

export async function creerUrlTelechargement(
  doc: { chemin: string; nom: string },
  options?: { inline?: boolean },
) {
  const signedOptions = options?.inline ? undefined : { download: doc.nom };

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_CASIER)
    .createSignedUrl(doc.chemin, 300, signedOptions);

  if (error || !data) {
    throw new CasierError("Impossible de générer le lien de téléchargement.");
  }

  return data.signedUrl;
}

// ───────────────────────────────────────────────
//  DOSSIERS
// ───────────────────────────────────────────────
//
// Un seul niveau (pas de sous-dossiers) : suffisant pour ranger un casier
// scolaire, plus simple à naviguer et à glisser-déposer qu'une arborescence.
// Même dualité que les documents : eleveId null = dossier partagé par le
// prof pour toute la matière, renseigné = dossier personnel de cet élève.

const NOM_DOSSIER_MAX = 60;

function validerNomDossier(nom: string): string {
  const nomPropre = nom.trim();
  if (!nomPropre) {
    throw new CasierError("Le nom du dossier est obligatoire.");
  }
  if (nomPropre.length > NOM_DOSSIER_MAX) {
    throw new CasierError(`Le nom du dossier est trop long (${NOM_DOSSIER_MAX} caractères maximum).`);
  }
  return nomPropre;
}

export async function creerDossierEleve(eleveId: string, nom: string) {
  const eleve = await prisma.user.findUnique({
    where: { id: eleveId, role: "ELEVE" },
    select: { classe: { select: { niveau: true } } },
  });
  if (!eleve?.classe) {
    throw new CasierError("Tu dois être rattaché à une classe pour utiliser le casier.");
  }
  const matiere = MATIERE_PAR_NIVEAU[eleve.classe.niveau];
  const nomPropre = validerNomDossier(nom);

  return prisma.dossierCasier.create({
    data: { nom: nomPropre, matiere, eleveId, auteurId: eleveId },
  });
}

export async function creerDossierProf(profId: string, matiere: Matiere, nom: string) {
  const nomPropre = validerNomDossier(nom);
  return prisma.dossierCasier.create({
    data: { nom: nomPropre, matiere, eleveId: null, auteurId: profId },
  });
}

export async function renommerDossier(id: string, nom: string) {
  const nomPropre = validerNomDossier(nom);
  return prisma.dossierCasier.update({ where: { id }, data: { nom: nomPropre } });
}

export async function obtenirDossier(id: string) {
  return prisma.dossierCasier.findUnique({ where: { id } });
}

/** Supprime le dossier — les documents qu'il contenait reviennent en vrac à la racine (onDelete: SetNull). */
export async function supprimerDossier(id: string) {
  await prisma.dossierCasier.delete({ where: { id } });
}

export async function listerDossiersPartages(matiere: Matiere) {
  return prisma.dossierCasier.findMany({
    where: { matiere, eleveId: null },
    include: { _count: { select: { documents: true } } },
    orderBy: { nom: "asc" },
  });
}

export async function listerDossiersEleve(eleveId: string) {
  return prisma.dossierCasier.findMany({
    where: { eleveId },
    include: { _count: { select: { documents: true } } },
    orderBy: { nom: "asc" },
  });
}

/** Déplace un document dans un dossier, ou en vrac à la racine si dossierId est null. */
export async function deplacerDocument(id: string, dossierId: string | null) {
  return prisma.documentCasier.update({ where: { id }, data: { dossierId } });
}
