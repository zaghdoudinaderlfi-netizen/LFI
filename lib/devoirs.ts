import { randomUUID } from "crypto";
import { Niveau, TypeExercice } from "@prisma/client";
import { prisma } from "./prisma";
import { supabaseAdmin, BUCKET_PIECES_JOINTES } from "./supabase";
import { EXTENSIONS_DOCUMENTS, TAILLE_MAX_OCTETS, extensionDe, nomFichierSur } from "./fichiers";
import { notifierElevesDuNiveau } from "./notifications";
import { lireChampsFormulaire, ChampFormulaire, FormulaireError } from "./formulaires";

export class DevoirError extends Error {}

// Types d'exercice correspondant à un "devoir" (dépôt élève).
export const TYPES_DEVOIR = [TypeExercice.DEVOIR_PDF, TypeExercice.DEVOIR_PDF_FORMULAIRE] as const;

export const TYPE_DEVOIR_LABELS: Record<(typeof TYPES_DEVOIR)[number], string> = {
  [TypeExercice.DEVOIR_PDF]: "Envoi de fichier",
  [TypeExercice.DEVOIR_PDF_FORMULAIRE]: "PDF-formulaire (rempli en ligne)",
};

function estTypeDevoir(type: TypeExercice): type is (typeof TYPES_DEVOIR)[number] {
  return (TYPES_DEVOIR as readonly TypeExercice[]).includes(type);
}

type DevoirInput = {
  titre: string;
  consigne: string;
  points: number;
  dateLimite?: Date | null;
  type: TypeExercice;
};

function validerDevoirInput({ titre, consigne, points, type }: DevoirInput) {
  if (!titre.trim()) {
    throw new DevoirError("Le titre est obligatoire.");
  }

  if (!consigne.trim()) {
    throw new DevoirError("La consigne est obligatoire.");
  }

  if (!Number.isFinite(points) || points <= 0) {
    throw new DevoirError("Le barème doit être un nombre positif.");
  }

  if (!estTypeDevoir(type)) {
    throw new DevoirError("Type de devoir invalide.");
  }
}

export async function creerDevoir(coursId: string, data: DevoirInput) {
  validerDevoirInput(data);

  const cours = await prisma.cours.findUnique({ where: { id: coursId } });
  if (!cours) {
    throw new DevoirError("Cours introuvable.");
  }

  const devoir = await prisma.exercice.create({
    data: {
      coursId,
      titre: data.titre.trim(),
      consigne: data.consigne.trim(),
      type: data.type,
      points: data.points,
      dateLimite: data.dateLimite ?? null,
    },
  });

  if (cours.publie) {
    await notifierElevesDuNiveau(
      cours.niveau,
      `Nouveau devoir : « ${devoir.titre} » (${cours.titre})`,
      `/eleve/cours/${cours.slug}`
    );
  }

  return devoir;
}

export async function supprimerDevoir(id: string) {
  const devoir = await prisma.exercice.findUnique({ where: { id } });
  if (!devoir || !estTypeDevoir(devoir.type)) {
    throw new DevoirError("Devoir introuvable.");
  }

  if (devoir.sujetChemin) {
    await supabaseAdmin.storage.from(BUCKET_PIECES_JOINTES).remove([devoir.sujetChemin]);
  }

  await prisma.exercice.delete({ where: { id } });
}

export async function listerDevoirsCours(coursId: string) {
  return prisma.exercice.findMany({
    where: { coursId, type: { in: [...TYPES_DEVOIR] } },
    orderBy: [{ ordre: "asc" }, { id: "asc" }],
  });
}

export async function listerDevoirsAFaire(eleveId: string, niveau: Niveau) {
  const devoirs = await prisma.exercice.findMany({
    where: {
      type: { in: [...TYPES_DEVOIR] },
      cours: { niveau, publie: true },
    },
    include: {
      cours: { select: { id: true, titre: true, slug: true } },
      soumissions: {
        where: { OR: [{ eleveId }, { membres: { some: { eleveId } } }] },
        select: { id: true, corrigeManuellement: true, note: true },
      },
    },
    orderBy: [{ dateLimite: "asc" }, { ordre: "asc" }],
  });

  return devoirs.map(({ soumissions, ...devoir }) => ({
    ...devoir,
    soumission: soumissions[0] ?? null,
  }));
}

export async function obtenirDevoir(id: string) {
  const devoir = await prisma.exercice.findUnique({ where: { id } });
  if (!devoir || !estTypeDevoir(devoir.type)) return null;
  return devoir;
}

export async function definirSujetDevoir(devoirId: string, fichier: File) {
  const devoir = await prisma.exercice.findUnique({ where: { id: devoirId } });
  if (!devoir || devoir.type !== TypeExercice.DEVOIR_PDF) {
    throw new DevoirError("Devoir introuvable.");
  }

  if (fichier.size === 0) {
    throw new DevoirError("Le fichier est vide.");
  }

  if (fichier.size > TAILLE_MAX_OCTETS) {
    throw new DevoirError("Le fichier dépasse la taille maximale autorisée (10 Mo).");
  }

  const extension = extensionDe(fichier.name);
  if (!EXTENSIONS_DOCUMENTS.has(extension)) {
    throw new DevoirError("Type de fichier non autorisé (PDF ou image uniquement).");
  }

  const nomNettoye = nomFichierSur(fichier.name);
  const chemin = `${devoir.coursId}/devoirs/${devoirId}/${randomUUID()}-${nomNettoye}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET_PIECES_JOINTES)
    .upload(chemin, fichier, {
      contentType: fichier.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    throw new DevoirError("Échec de l'envoi du sujet.");
  }

  try {
    const misAJour = await prisma.exercice.update({
      where: { id: devoirId },
      data: {
        sujetNom: fichier.name,
        sujetChemin: chemin,
        sujetTaille: fichier.size,
        sujetTypeMime: fichier.type || "application/octet-stream",
      },
    });

    if (devoir.sujetChemin) {
      await supabaseAdmin.storage.from(BUCKET_PIECES_JOINTES).remove([devoir.sujetChemin]);
    }

    return misAJour;
  } catch (err) {
    await supabaseAdmin.storage.from(BUCKET_PIECES_JOINTES).remove([chemin]);
    throw err;
  }
}

// PDF-formulaire : le sujet doit être un PDF contenant des champs AcroForm
// (zones de texte, cases à cocher...). Sans champ détecté, on refuse le fichier
// pour que le prof sache qu'il doit le préparer avec un outil PDF avant.
export async function definirSujetFormulaire(devoirId: string, fichier: File) {
  const devoir = await prisma.exercice.findUnique({ where: { id: devoirId } });
  if (!devoir || devoir.type !== TypeExercice.DEVOIR_PDF_FORMULAIRE) {
    throw new DevoirError("Devoir introuvable.");
  }

  if (fichier.size === 0) {
    throw new DevoirError("Le fichier est vide.");
  }

  if (fichier.size > TAILLE_MAX_OCTETS) {
    throw new DevoirError("Le fichier dépasse la taille maximale autorisée (10 Mo).");
  }

  if (extensionDe(fichier.name) !== "pdf") {
    throw new DevoirError("Le PDF-formulaire doit être un fichier PDF.");
  }

  const octets = new Uint8Array(await fichier.arrayBuffer());
  let champs;
  try {
    champs = await lireChampsFormulaire(octets);
  } catch (err) {
    if (err instanceof FormulaireError) {
      throw new DevoirError(err.message);
    }
    throw err;
  }

  if (champs.length === 0) {
    throw new DevoirError(
      "Ce PDF ne contient pas de champs remplissables (zones de texte ou cases à cocher). Prépare-le avec un outil PDF (LibreOffice, Acrobat...) avant de le déposer."
    );
  }

  const nomNettoye = nomFichierSur(fichier.name);
  const chemin = `${devoir.coursId}/devoirs/${devoirId}/${randomUUID()}-${nomNettoye}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET_PIECES_JOINTES)
    .upload(chemin, fichier, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (error) {
    throw new DevoirError("Échec de l'envoi du formulaire.");
  }

  try {
    const misAJour = await prisma.exercice.update({
      where: { id: devoirId },
      data: {
        sujetNom: fichier.name,
        sujetChemin: chemin,
        sujetTaille: fichier.size,
        sujetTypeMime: "application/pdf",
      },
    });

    if (devoir.sujetChemin) {
      await supabaseAdmin.storage.from(BUCKET_PIECES_JOINTES).remove([devoir.sujetChemin]);
    }

    return misAJour;
  } catch (err) {
    await supabaseAdmin.storage.from(BUCKET_PIECES_JOINTES).remove([chemin]);
    throw err;
  }
}

export async function supprimerSujetDevoir(devoirId: string) {
  const devoir = await prisma.exercice.findUnique({ where: { id: devoirId } });
  if (!devoir || !estTypeDevoir(devoir.type)) {
    throw new DevoirError("Devoir introuvable.");
  }

  if (!devoir.sujetChemin) {
    return devoir;
  }

  await supabaseAdmin.storage.from(BUCKET_PIECES_JOINTES).remove([devoir.sujetChemin]);

  return prisma.exercice.update({
    where: { id: devoirId },
    data: { sujetNom: null, sujetChemin: null, sujetTaille: null, sujetTypeMime: null },
  });
}

export async function creerUrlSujetDevoir(
  devoir: { sujetChemin: string | null; sujetNom: string | null },
  options?: { inline?: boolean }
) {
  if (!devoir.sujetChemin || !devoir.sujetNom) {
    throw new DevoirError("Aucun sujet déposé.");
  }

  const signedOptions = options?.inline ? undefined : { download: devoir.sujetNom };

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_PIECES_JOINTES)
    .createSignedUrl(devoir.sujetChemin, 300, signedOptions);

  if (error || !data) {
    throw new DevoirError("Impossible de générer le lien.");
  }

  return data.signedUrl;
}

// Télécharge les octets bruts du sujet d'un devoir (utilisé pour le lire avec
// pdf-lib côté serveur ou le servir tel quel à pdf.js côté client).
export async function obtenirOctetsSujetDevoir(devoir: {
  sujetChemin: string | null;
}): Promise<Uint8Array> {
  if (!devoir.sujetChemin) {
    throw new DevoirError("Aucun sujet déposé.");
  }

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_PIECES_JOINTES)
    .download(devoir.sujetChemin);

  if (error || !data) {
    throw new DevoirError("Impossible de lire le sujet.");
  }

  return new Uint8Array(await data.arrayBuffer());
}

// Télécharge le PDF-formulaire d'un devoir et y lit les champs détectés.
export async function obtenirChampsFormulaireDevoir(devoir: {
  type: TypeExercice;
  sujetChemin: string | null;
}): Promise<ChampFormulaire[]> {
  if (devoir.type !== TypeExercice.DEVOIR_PDF_FORMULAIRE || !devoir.sujetChemin) {
    return [];
  }

  const octets = await obtenirOctetsSujetDevoir(devoir);
  return lireChampsFormulaire(octets);
}
