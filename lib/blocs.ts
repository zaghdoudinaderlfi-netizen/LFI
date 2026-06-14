import { randomUUID } from "crypto";
import { TypeBloc } from "@prisma/client";
import { prisma } from "./prisma";
import { supabaseAdmin, BUCKET_PIECES_JOINTES } from "./supabase";
import { TAILLE_MAX_OCTETS, extensionDe, nomFichierSur } from "./fichiers";
import { nettoyerHtml } from "./sanitize-html";
import { BlocError, urlVideoEmbed } from "./blocs-constants";

export * from "./blocs-constants";

const EXTENSIONS_IMAGE = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg"]);
const EXTENSIONS_PDF = new Set(["pdf"]);

const PREFIX_BLOC = "blocs";

// ───────────────────────────────────────────────
//  LECTURE
// ───────────────────────────────────────────────

export async function listerBlocsCours(coursId: string) {
  return prisma.bloc.findMany({
    where: { coursId },
    orderBy: [{ ordre: "asc" }, { createdAt: "asc" }],
  });
}

export async function obtenirBlocAvecCours(id: string) {
  return prisma.bloc.findUnique({ where: { id }, include: { cours: true } });
}

async function prochainOrdre(coursId: string) {
  const dernier = await prisma.bloc.findFirst({
    where: { coursId },
    orderBy: { ordre: "desc" },
    select: { ordre: true },
  });
  return (dernier?.ordre ?? -1) + 1;
}

function validerUrl(url: string, label: string): string {
  const trimmed = url.trim();
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error();
  } catch {
    throw new BlocError(`${label} doit être un lien valide (commençant par http:// ou https://).`);
  }
  return trimmed;
}

// ───────────────────────────────────────────────
//  AJOUT DE BLOCS
// ───────────────────────────────────────────────

export async function ajouterBlocTexte(coursId: string, html: string) {
  const nettoye = await nettoyerHtml(html);

  if (!nettoye || nettoye === "<p></p>") {
    throw new BlocError("Le bloc de texte est vide.");
  }

  const ordre = await prochainOrdre(coursId);
  return prisma.bloc.create({
    data: { coursId, type: TypeBloc.TEXTE, contenu: nettoye, ordre },
  });
}

async function ajouterBlocFichier(
  coursId: string,
  type: "IMAGE" | "PDF",
  fichier: File,
  extensionsAutorisees: Set<string>,
  labelType: string
) {
  if (fichier.size === 0) {
    throw new BlocError("Le fichier est vide.");
  }

  if (fichier.size > TAILLE_MAX_OCTETS) {
    throw new BlocError("Le fichier dépasse la taille maximale autorisée (10 Mo).");
  }

  const extension = extensionDe(fichier.name);
  if (!extensionsAutorisees.has(extension)) {
    throw new BlocError(`Format de fichier non autorisé pour un bloc ${labelType}.`);
  }

  const nomNettoye = nomFichierSur(fichier.name);
  const chemin = `${PREFIX_BLOC}/${coursId}/${randomUUID()}-${nomNettoye}`;

  const { error } = await supabaseAdmin.storage.from(BUCKET_PIECES_JOINTES).upload(chemin, fichier, {
    contentType: fichier.type || "application/octet-stream",
    upsert: false,
  });

  if (error) {
    throw new BlocError("Échec de l'envoi du fichier.");
  }

  const ordre = await prochainOrdre(coursId);

  try {
    return await prisma.bloc.create({
      data: {
        coursId,
        type: TypeBloc[type],
        ordre,
        fichierNom: fichier.name,
        fichierChemin: chemin,
        fichierTaille: fichier.size,
        fichierTypeMime: fichier.type || "application/octet-stream",
      },
    });
  } catch (err) {
    await supabaseAdmin.storage.from(BUCKET_PIECES_JOINTES).remove([chemin]);
    throw err;
  }
}

export async function ajouterBlocImage(coursId: string, fichier: File) {
  return ajouterBlocFichier(coursId, "IMAGE", fichier, EXTENSIONS_IMAGE, "image");
}

export async function ajouterBlocPdf(coursId: string, fichier: File) {
  return ajouterBlocFichier(coursId, "PDF", fichier, EXTENSIONS_PDF, "PDF");
}

export async function ajouterBlocVideo(coursId: string, url: string) {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new BlocError("Le lien de la vidéo est obligatoire.");
  }
  if (!urlVideoEmbed(trimmed)) {
    throw new BlocError("Lien vidéo non reconnu : utilise un lien YouTube ou Vimeo.");
  }

  const ordre = await prochainOrdre(coursId);
  return prisma.bloc.create({
    data: { coursId, type: TypeBloc.VIDEO, contenu: trimmed, ordre },
  });
}

export async function ajouterBlocEditeurPython(
  coursId: string,
  { consigne, codeDepart }: { consigne: string; codeDepart?: string }
) {
  const consigneNettoyee = consigne.trim();
  if (!consigneNettoyee) {
    throw new BlocError("La consigne est obligatoire.");
  }

  const ordre = await prochainOrdre(coursId);
  return prisma.bloc.create({
    data: {
      coursId,
      type: TypeBloc.EDITEUR_PYTHON,
      ordre,
      contenu: consigneNettoyee,
      codeDepart: codeDepart?.trim() || null,
    },
  });
}

export async function ajouterBlocActivite(
  coursId: string,
  { titre, outil, lien }: { titre?: string; outil: string; lien: string }
) {
  if (!outil.trim()) {
    throw new BlocError("Choisis un outil pour ce bloc.");
  }

  const url = validerUrl(lien, "Le lien de l'activité");
  const ordre = await prochainOrdre(coursId);

  return prisma.bloc.create({
    data: {
      coursId,
      type: TypeBloc.ACTIVITE,
      ordre,
      titre: titre?.trim() || null,
      outil: outil.trim(),
      contenu: url,
    },
  });
}

export async function ajouterBlocLien(
  coursId: string,
  { titre, lien }: { titre: string; lien: string }
) {
  if (!titre.trim()) {
    throw new BlocError("Le titre du lien est obligatoire.");
  }

  const url = validerUrl(lien, "Le lien");
  const ordre = await prochainOrdre(coursId);

  return prisma.bloc.create({
    data: { coursId, type: TypeBloc.LIEN, ordre, titre: titre.trim(), contenu: url },
  });
}

// ───────────────────────────────────────────────
//  SUPPRESSION / RÉORDONNANCEMENT
// ───────────────────────────────────────────────

export async function supprimerBloc(id: string) {
  const bloc = await prisma.bloc.findUnique({ where: { id } });
  if (!bloc) {
    throw new BlocError("Bloc introuvable.");
  }

  if (bloc.fichierChemin) {
    await supabaseAdmin.storage.from(BUCKET_PIECES_JOINTES).remove([bloc.fichierChemin]);
  }

  await prisma.bloc.delete({ where: { id } });
}

export async function deplacerBloc(id: string, direction: "haut" | "bas") {
  const bloc = await prisma.bloc.findUnique({ where: { id } });
  if (!bloc) {
    throw new BlocError("Bloc introuvable.");
  }

  const voisin = await prisma.bloc.findFirst({
    where: {
      coursId: bloc.coursId,
      ordre: direction === "haut" ? { lt: bloc.ordre } : { gt: bloc.ordre },
    },
    orderBy: { ordre: direction === "haut" ? "desc" : "asc" },
  });

  if (!voisin) return;

  await prisma.$transaction([
    prisma.bloc.update({ where: { id: bloc.id }, data: { ordre: voisin.ordre } }),
    prisma.bloc.update({ where: { id: voisin.id }, data: { ordre: bloc.ordre } }),
  ]);
}
