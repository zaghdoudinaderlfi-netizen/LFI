import { randomUUID } from "crypto";
import { prisma } from "./prisma";
import { supabaseAdmin, BUCKET_PIECES_JOINTES } from "./supabase";
import { TAILLE_MAX_OCTETS, extensionDe, nomFichierSur } from "./fichiers";

export { formaterTaille } from "./fichiers";

export class LogicielError extends Error {}

const EXTENSIONS_LOGICIELS = new Set(["zip", "exe", "msi", "dmg", "deb", "appimage", "7z", "tar", "gz"]);

const PREFIX_LOGICIEL = "logiciels";

function validerUrl(url: string): string {
  const trimmed = url.trim();
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error();
  } catch {
    throw new LogicielError("Le lien doit être une adresse valide (commençant par http:// ou https://).");
  }
  return trimmed;
}

async function televerserFichier(fichier: File) {
  if (fichier.size > TAILLE_MAX_OCTETS) {
    throw new LogicielError("Le fichier dépasse la taille maximale autorisée (10 Mo).");
  }

  const extension = extensionDe(fichier.name);
  if (!EXTENSIONS_LOGICIELS.has(extension)) {
    throw new LogicielError("Format de fichier non autorisé pour un logiciel.");
  }

  const nomNettoye = nomFichierSur(fichier.name);
  const chemin = `${PREFIX_LOGICIEL}/${randomUUID()}-${nomNettoye}`;

  const { error } = await supabaseAdmin.storage.from(BUCKET_PIECES_JOINTES).upload(chemin, fichier, {
    contentType: fichier.type || "application/octet-stream",
    upsert: false,
  });

  if (error) {
    throw new LogicielError("Échec de l'envoi du fichier.");
  }

  return {
    fichierNom: fichier.name,
    fichierChemin: chemin,
    fichierTaille: fichier.size,
    fichierTypeMime: fichier.type || "application/octet-stream",
  };
}

// ───────────────────────────────────────────────
//  LECTURE
// ───────────────────────────────────────────────

export async function listerLogiciels() {
  return prisma.logiciel.findMany({ orderBy: [{ ordre: "asc" }, { createdAt: "asc" }] });
}

export async function obtenirLogiciel(id: string) {
  return prisma.logiciel.findUnique({ where: { id } });
}

async function prochainOrdre() {
  const dernier = await prisma.logiciel.findFirst({
    orderBy: { ordre: "desc" },
    select: { ordre: true },
  });
  return (dernier?.ordre ?? -1) + 1;
}

// ───────────────────────────────────────────────
//  AJOUT / MODIFICATION
// ───────────────────────────────────────────────

export async function ajouterLogiciel({
  titre,
  description,
  lien,
  fichier,
}: {
  titre: string;
  description: string;
  lien?: string;
  fichier?: File | null;
}) {
  if (!titre.trim()) throw new LogicielError("Le titre est obligatoire.");
  if (!description.trim()) throw new LogicielError("La description est obligatoire.");

  const lienValide = lien?.trim() ? validerUrl(lien) : null;
  const aFichier = !!fichier && fichier.size > 0;

  if (!lienValide && !aFichier) {
    throw new LogicielError("Indique un lien de téléchargement ou un fichier.");
  }

  const fichierInfos = aFichier ? await televerserFichier(fichier!) : null;
  const ordre = await prochainOrdre();

  try {
    return await prisma.logiciel.create({
      data: {
        titre: titre.trim(),
        description: description.trim(),
        lien: lienValide,
        ordre,
        ...fichierInfos,
      },
    });
  } catch (err) {
    if (fichierInfos) {
      await supabaseAdmin.storage.from(BUCKET_PIECES_JOINTES).remove([fichierInfos.fichierChemin]);
    }
    throw err;
  }
}

export async function modifierLogiciel(
  id: string,
  { titre, description, lien }: { titre: string; description: string; lien?: string }
) {
  const logiciel = await prisma.logiciel.findUnique({ where: { id } });
  if (!logiciel) throw new LogicielError("Logiciel introuvable.");

  if (!titre.trim()) throw new LogicielError("Le titre est obligatoire.");
  if (!description.trim()) throw new LogicielError("La description est obligatoire.");

  const lienValide = lien?.trim() ? validerUrl(lien) : null;

  if (!lienValide && !logiciel.fichierNom) {
    throw new LogicielError("Indique un lien de téléchargement ou un fichier.");
  }

  return prisma.logiciel.update({
    where: { id },
    data: { titre: titre.trim(), description: description.trim(), lien: lienValide },
  });
}

export async function ajouterFichierLogiciel(id: string, fichier: File) {
  const logiciel = await prisma.logiciel.findUnique({ where: { id } });
  if (!logiciel) throw new LogicielError("Logiciel introuvable.");
  if (fichier.size === 0) throw new LogicielError("Le fichier est vide.");

  const infos = await televerserFichier(fichier);

  try {
    const mis = await prisma.logiciel.update({ where: { id }, data: infos });
    if (logiciel.fichierChemin) {
      await supabaseAdmin.storage.from(BUCKET_PIECES_JOINTES).remove([logiciel.fichierChemin]);
    }
    return mis;
  } catch (err) {
    await supabaseAdmin.storage.from(BUCKET_PIECES_JOINTES).remove([infos.fichierChemin]);
    throw err;
  }
}

// ───────────────────────────────────────────────
//  SUPPRESSION / RÉORDONNANCEMENT
// ───────────────────────────────────────────────

export async function supprimerFichierLogiciel(id: string) {
  const logiciel = await prisma.logiciel.findUnique({ where: { id } });
  if (!logiciel) throw new LogicielError("Logiciel introuvable.");
  if (!logiciel.fichierChemin) return logiciel;

  if (!logiciel.lien) {
    throw new LogicielError("Impossible de retirer le fichier sans lien de remplacement : ajoute d'abord un lien.");
  }

  await supabaseAdmin.storage.from(BUCKET_PIECES_JOINTES).remove([logiciel.fichierChemin]);

  return prisma.logiciel.update({
    where: { id },
    data: { fichierNom: null, fichierChemin: null, fichierTaille: null, fichierTypeMime: null },
  });
}

export async function supprimerLogiciel(id: string) {
  const logiciel = await prisma.logiciel.findUnique({ where: { id } });
  if (!logiciel) throw new LogicielError("Logiciel introuvable.");

  if (logiciel.fichierChemin) {
    await supabaseAdmin.storage.from(BUCKET_PIECES_JOINTES).remove([logiciel.fichierChemin]);
  }

  await prisma.logiciel.delete({ where: { id } });
}

export async function deplacerLogiciel(id: string, direction: "haut" | "bas") {
  const logiciel = await prisma.logiciel.findUnique({ where: { id } });
  if (!logiciel) throw new LogicielError("Logiciel introuvable.");

  const voisin = await prisma.logiciel.findFirst({
    where: { ordre: direction === "haut" ? { lt: logiciel.ordre } : { gt: logiciel.ordre } },
    orderBy: { ordre: direction === "haut" ? "desc" : "asc" },
  });

  if (!voisin) return;

  await prisma.$transaction([
    prisma.logiciel.update({ where: { id: logiciel.id }, data: { ordre: voisin.ordre } }),
    prisma.logiciel.update({ where: { id: voisin.id }, data: { ordre: logiciel.ordre } }),
  ]);
}

// ───────────────────────────────────────────────
//  TÉLÉCHARGEMENT
// ───────────────────────────────────────────────

export async function creerUrlTelechargementLogiciel(
  logiciel: { fichierChemin: string; fichierNom: string },
  options?: { inline?: boolean }
) {
  const signedOptions = options?.inline ? undefined : { download: logiciel.fichierNom };

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_PIECES_JOINTES)
    .createSignedUrl(logiciel.fichierChemin, 300, signedOptions);

  if (error || !data) {
    throw new LogicielError("Impossible de générer le lien de téléchargement.");
  }

  return data.signedUrl;
}
