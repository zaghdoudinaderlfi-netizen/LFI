import { randomUUID } from "crypto";
import { prisma } from "./prisma";
import { supabaseAdmin, BUCKET_PIECES_JOINTES } from "./supabase";
import { TAILLE_MAX_OCTETS, extensionDe, nomFichierSur, formaterTaille } from "./fichiers";

export { formaterTaille, TAILLE_MAX_OCTETS };

export class AnnonceError extends Error {}

const EXTENSIONS_AUTORISEES = new Set([
  "pdf", "png", "jpg", "jpeg", "gif", "webp", "svg",
  "txt", "csv", "zip", "doc", "docx", "ppt", "pptx", "xls", "xlsx",
]);

/** La bulle d'annonce actuellement diffusée aux élèves, s'il y en a une. */
export async function obtenirAnnonceActive() {
  return prisma.annonce.findFirst({
    where: { actif: true },
    orderBy: { createdAt: "desc" },
  });
}

/** Historique complet (le prof y retrouve ses annonces précédentes). */
export async function listerAnnonces() {
  return prisma.annonce.findMany({ orderBy: { createdAt: "desc" } });
}

export type CreerAnnonceInput = {
  auteurId: string;
  message: string;
  fichier?: File | null;
};

/**
 * Publie une nouvelle annonce et désactive automatiquement la précédente
 * (une seule bulle affichée aux élèves à la fois).
 */
export async function creerAnnonce({ auteurId, message, fichier }: CreerAnnonceInput) {
  const texte = message.trim();
  if (!texte) {
    throw new AnnonceError("Le message ne peut pas être vide.");
  }
  if (texte.length > 2000) {
    throw new AnnonceError("Le message est trop long (2000 caractères maximum).");
  }

  let fichierNom: string | null = null;
  let fichierChemin: string | null = null;
  let fichierTaille: number | null = null;
  let fichierTypeMime: string | null = null;

  if (fichier && fichier.size > 0) {
    if (fichier.size > TAILLE_MAX_OCTETS) {
      throw new AnnonceError("Le fichier dépasse la taille maximale autorisée (10 Mo).");
    }
    const extension = extensionDe(fichier.name);
    if (!EXTENSIONS_AUTORISEES.has(extension)) {
      throw new AnnonceError("Type de fichier non autorisé.");
    }

    const nomNettoye = nomFichierSur(fichier.name);
    const chemin = `annonces/${randomUUID()}-${nomNettoye}`;
    const { error } = await supabaseAdmin.storage.from(BUCKET_PIECES_JOINTES).upload(chemin, fichier, {
      contentType: fichier.type || "application/octet-stream",
      upsert: false,
    });
    if (error) {
      throw new AnnonceError("Échec de l'envoi du fichier.");
    }

    fichierNom = fichier.name;
    fichierChemin = chemin;
    fichierTaille = fichier.size;
    fichierTypeMime = fichier.type || "application/octet-stream";
  }

  await prisma.annonce.updateMany({ where: { actif: true }, data: { actif: false } });

  try {
    return await prisma.annonce.create({
      data: {
        auteurId,
        message: texte,
        actif: true,
        fichierNom,
        fichierChemin,
        fichierTaille,
        fichierTypeMime,
      },
    });
  } catch (err) {
    if (fichierChemin) {
      await supabaseAdmin.storage.from(BUCKET_PIECES_JOINTES).remove([fichierChemin]);
    }
    throw err;
  }
}

export async function desactiverAnnonce(id: string) {
  await prisma.annonce.updateMany({ where: { id }, data: { actif: false } });
}

export async function reactiverAnnonce(id: string) {
  await prisma.annonce.updateMany({ where: { actif: true }, data: { actif: false } });
  await prisma.annonce.updateMany({ where: { id }, data: { actif: true } });
}

export async function supprimerAnnonce(id: string) {
  const annonce = await prisma.annonce.findUnique({ where: { id } });
  if (!annonce) return;
  await prisma.annonce.delete({ where: { id } });
  if (annonce.fichierChemin) {
    await supabaseAdmin.storage.from(BUCKET_PIECES_JOINTES).remove([annonce.fichierChemin]);
  }
}

export async function creerUrlFichierAnnonce(annonce: {
  fichierChemin: string | null;
  fichierNom: string | null;
}) {
  if (!annonce.fichierChemin || !annonce.fichierNom) {
    throw new AnnonceError("Aucun fichier joint.");
  }

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_PIECES_JOINTES)
    .createSignedUrl(annonce.fichierChemin, 300, { download: annonce.fichierNom });

  if (error || !data) {
    throw new AnnonceError("Impossible de générer le lien.");
  }

  return data.signedUrl;
}
