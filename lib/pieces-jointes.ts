import { randomUUID } from "crypto";
import { prisma } from "./prisma";
import { supabaseAdmin, BUCKET_PIECES_JOINTES } from "./supabase";

export { formaterTaille } from "./fichiers";

export class PieceJointeError extends Error {}

export const TAILLE_MAX_OCTETS = 10 * 1024 * 1024; // 10 Mo

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

function extensionDe(nomFichier: string): string {
  const parts = nomFichier.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

function nomFichierSur(nomFichier: string): string {
  // Garde uniquement le nom de fichier, sans chemin ni caractères spéciaux.
  const base = nomFichier.split(/[/\\]/).pop() ?? "fichier";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function ajouterPieceJointe(coursId: string, fichier: File) {
  const cours = await prisma.cours.findUnique({ where: { id: coursId } });
  if (!cours) {
    throw new PieceJointeError("Cours introuvable.");
  }

  if (fichier.size === 0) {
    throw new PieceJointeError("Le fichier est vide.");
  }

  if (fichier.size > TAILLE_MAX_OCTETS) {
    throw new PieceJointeError("Le fichier dépasse la taille maximale autorisée (10 Mo).");
  }

  const extension = extensionDe(fichier.name);
  if (!EXTENSIONS_AUTORISEES.has(extension)) {
    throw new PieceJointeError("Type de fichier non autorisé.");
  }

  const nomNettoye = nomFichierSur(fichier.name);
  const chemin = `${coursId}/${randomUUID()}-${nomNettoye}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET_PIECES_JOINTES)
    .upload(chemin, fichier, {
      contentType: fichier.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    throw new PieceJointeError("Échec de l'envoi du fichier.");
  }

  try {
    return await prisma.pieceJointe.create({
      data: {
        coursId,
        nom: fichier.name,
        chemin,
        taille: fichier.size,
        typeMime: fichier.type || "application/octet-stream",
      },
    });
  } catch (err) {
    await supabaseAdmin.storage.from(BUCKET_PIECES_JOINTES).remove([chemin]);
    throw err;
  }
}

export async function listerPiecesJointes(coursId: string) {
  return prisma.pieceJointe.findMany({
    where: { coursId },
    orderBy: [{ ordre: "asc" }, { createdAt: "asc" }],
  });
}

export async function obtenirPieceJointeAvecCours(id: string) {
  return prisma.pieceJointe.findUnique({
    where: { id },
    include: { cours: true },
  });
}

export async function supprimerPieceJointe(id: string) {
  const piece = await prisma.pieceJointe.findUnique({ where: { id } });
  if (!piece) {
    throw new PieceJointeError("Pièce jointe introuvable.");
  }

  await supabaseAdmin.storage.from(BUCKET_PIECES_JOINTES).remove([piece.chemin]);
  await prisma.pieceJointe.delete({ where: { id } });
}

export async function creerUrlTelechargement(
  piece: { chemin: string; nom: string },
  options?: { inline?: boolean }
) {
  const signedOptions = options?.inline ? undefined : { download: piece.nom };

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_PIECES_JOINTES)
    .createSignedUrl(piece.chemin, 300, signedOptions);

  if (error || !data) {
    throw new PieceJointeError("Impossible de générer le lien de téléchargement.");
  }

  return data.signedUrl;
}
