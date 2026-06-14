import { randomUUID } from "crypto";
import { TypeExercice } from "@prisma/client";
import { prisma } from "./prisma";
import { supabaseAdmin, BUCKET_PIECES_JOINTES, BUCKET_RENDUS_DEVOIRS } from "./supabase";
import { notifierProfs } from "./notifications";
import { remplirFormulaire, FormulaireError } from "./formulaires";
import { estTypeExerciceCode } from "./exercices-code";

export class SoumissionError extends Error {}

export const TAILLE_MAX_OCTETS = 10 * 1024 * 1024; // 10 Mo

const EXTENSIONS_AUTORISEES = new Set(["pdf", "jpg", "jpeg", "png", "webp"]);

function extensionDe(nomFichier: string): string {
  const parts = nomFichier.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

function nomFichierSur(nomFichier: string): string {
  // Garde uniquement le nom de fichier, sans chemin ni caractères spéciaux.
  const base = nomFichier.split(/[/\\]/).pop() ?? "fichier";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function deposerSoumission(exerciceId: string, eleveId: string, fichier: File) {
  const exercice = await prisma.exercice.findUnique({
    where: { id: exerciceId },
    include: { cours: { select: { titre: true } } },
  });
  if (!exercice || exercice.type !== TypeExercice.DEVOIR_PDF) {
    throw new SoumissionError("Devoir introuvable.");
  }

  if (fichier.size === 0) {
    throw new SoumissionError("Le fichier est vide.");
  }

  if (fichier.size > TAILLE_MAX_OCTETS) {
    throw new SoumissionError("Le fichier dépasse la taille maximale autorisée (10 Mo).");
  }

  const extension = extensionDe(fichier.name);
  if (!EXTENSIONS_AUTORISEES.has(extension)) {
    throw new SoumissionError("Type de fichier non autorisé (PDF ou image uniquement).");
  }

  const nomNettoye = nomFichierSur(fichier.name);
  const chemin = `${exerciceId}/${eleveId}/${randomUUID()}-${nomNettoye}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET_RENDUS_DEVOIRS)
    .upload(chemin, fichier, {
      contentType: fichier.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    throw new SoumissionError("Échec de l'envoi du fichier.");
  }

  const existante = await prisma.soumission.findFirst({
    where: { exerciceId, eleveId },
  });

  const donneesFichier = {
    fichierNom: fichier.name,
    fichierChemin: chemin,
    fichierTaille: fichier.size,
    fichierTypeMime: fichier.type || "application/octet-stream",
  };

  let soumission;

  try {
    if (existante) {
      soumission = await prisma.soumission.update({
        where: { id: existante.id },
        data: donneesFichier,
      });

      if (existante.fichierChemin) {
        await supabaseAdmin.storage.from(BUCKET_RENDUS_DEVOIRS).remove([existante.fichierChemin]);
      }
    } else {
      soumission = await prisma.soumission.create({
        data: {
          exerciceId,
          eleveId,
          ...donneesFichier,
        },
      });
    }
  } catch (err) {
    await supabaseAdmin.storage.from(BUCKET_RENDUS_DEVOIRS).remove([chemin]);
    throw err;
  }

  const eleve = await prisma.user.findUnique({ where: { id: eleveId }, select: { nom: true } });
  await notifierProfs(
    `${eleve?.nom ?? "Un élève"} a déposé « ${exercice.titre} » (${exercice.cours.titre})`,
    "/prof/devoirs"
  );

  return soumission;
}

// Devoir "PDF-formulaire" : remplit le PDF déposé par le prof avec les réponses
// de l'élève et enregistre le résultat comme rendu.
export async function deposerSoumissionFormulaire(
  exerciceId: string,
  eleveId: string,
  reponses: Record<string, string | boolean>
) {
  const exercice = await prisma.exercice.findUnique({
    where: { id: exerciceId },
    include: { cours: { select: { titre: true } } },
  });
  if (!exercice || exercice.type !== TypeExercice.DEVOIR_PDF_FORMULAIRE) {
    throw new SoumissionError("Devoir introuvable.");
  }

  if (!exercice.sujetChemin || !exercice.sujetNom) {
    throw new SoumissionError("Ce devoir n'a pas encore de formulaire PDF.");
  }

  const { data: modele, error: erreurTelechargement } = await supabaseAdmin.storage
    .from(BUCKET_PIECES_JOINTES)
    .download(exercice.sujetChemin);

  if (erreurTelechargement || !modele) {
    throw new SoumissionError("Impossible de récupérer le formulaire PDF.");
  }

  const octetsModele = new Uint8Array(await modele.arrayBuffer());

  let pdfRempli: Uint8Array;
  try {
    pdfRempli = await remplirFormulaire(octetsModele, reponses);
  } catch (err) {
    if (err instanceof FormulaireError) {
      throw new SoumissionError(err.message);
    }
    throw err;
  }

  const nomBase = exercice.sujetNom.replace(/\.pdf$/i, "");
  const fichierNom = `${nomBase}-rempli.pdf`;
  const chemin = `${exerciceId}/${eleveId}/${randomUUID()}-${nomFichierSur(fichierNom)}`;

  const { error: erreurEnvoi } = await supabaseAdmin.storage.from(BUCKET_RENDUS_DEVOIRS).upload(chemin, pdfRempli, {
    contentType: "application/pdf",
    upsert: false,
  });

  if (erreurEnvoi) {
    throw new SoumissionError("Échec de l'enregistrement du formulaire rempli.");
  }

  const existante = await prisma.soumission.findFirst({ where: { exerciceId, eleveId } });

  const donnees = {
    contenu: JSON.stringify(reponses),
    fichierNom,
    fichierChemin: chemin,
    fichierTaille: pdfRempli.byteLength,
    fichierTypeMime: "application/pdf",
  };

  let soumission;

  try {
    if (existante) {
      soumission = await prisma.soumission.update({
        where: { id: existante.id },
        data: donnees,
      });

      if (existante.fichierChemin) {
        await supabaseAdmin.storage.from(BUCKET_RENDUS_DEVOIRS).remove([existante.fichierChemin]);
      }
    } else {
      soumission = await prisma.soumission.create({
        data: { exerciceId, eleveId, ...donnees },
      });
    }
  } catch (err) {
    await supabaseAdmin.storage.from(BUCKET_RENDUS_DEVOIRS).remove([chemin]);
    throw err;
  }

  const eleve = await prisma.user.findUnique({ where: { id: eleveId }, select: { nom: true } });
  await notifierProfs(
    `${eleve?.nom ?? "Un élève"} a déposé « ${exercice.titre} » (${exercice.cours.titre})`,
    "/prof/devoirs"
  );

  return soumission;
}

const REGEX_CAPTURE_PNG = /^data:image\/png;base64,([a-zA-Z0-9+/]+=*)$/;

function normaliserSortie(sortie: string): string {
  return sortie.replace(/\r\n/g, "\n").trim();
}

// Soumission d'un exercice de code (PYTHON / TURTLE), exécuté côté élève via
// Skulpt. Pour PYTHON, la sortie du programme est comparée à la sortie
// attendue (correction automatique, résultat stocké dans `contenu.reussiAuto`
// en plus de `reussi`). Pour TURTLE, la correction est manuelle ; une capture
// du dessin (PNG) peut être jointe comme pièce du rendu.
export async function soumettreExerciceCode(
  exerciceId: string,
  eleveId: string,
  { code, sortie, captureDataUrl }: { code: string; sortie: string; captureDataUrl?: string | null }
) {
  const exercice = await prisma.exercice.findUnique({
    where: { id: exerciceId },
    include: { cours: { select: { titre: true } } },
  });
  if (!exercice || !estTypeExerciceCode(exercice.type)) {
    throw new SoumissionError("Exercice introuvable.");
  }

  if (!code.trim()) {
    throw new SoumissionError("Le code est vide.");
  }

  let reussi = false;
  let reussiAuto: boolean | undefined;
  if (exercice.type === TypeExercice.PYTHON) {
    reussiAuto = normaliserSortie(sortie) === normaliserSortie(exercice.sortieAttendue ?? "");
    reussi = reussiAuto;
  }

  const contenu = JSON.stringify({ code, sortie, ...(reussiAuto !== undefined ? { reussiAuto } : {}) });

  const existante = await prisma.soumission.findFirst({ where: { exerciceId, eleveId } });

  let donneesFichier: {
    fichierNom?: string;
    fichierChemin?: string;
    fichierTaille?: number;
    fichierTypeMime?: string;
  } = {};

  if (exercice.type === TypeExercice.TURTLE && captureDataUrl) {
    const correspondance = captureDataUrl.match(REGEX_CAPTURE_PNG);
    if (correspondance) {
      const octets = Buffer.from(correspondance[1], "base64");
      if (octets.length > 0 && octets.length <= TAILLE_MAX_OCTETS) {
        const chemin = `${exerciceId}/${eleveId}/${randomUUID()}-dessin.png`;
        const { error } = await supabaseAdmin.storage.from(BUCKET_RENDUS_DEVOIRS).upload(chemin, octets, {
          contentType: "image/png",
          upsert: false,
        });
        if (!error) {
          donneesFichier = {
            fichierNom: "dessin.png",
            fichierChemin: chemin,
            fichierTaille: octets.length,
            fichierTypeMime: "image/png",
          };
        }
      }
    }
  }

  const donnees = { contenu, reussi, ...donneesFichier };

  let soumission;
  try {
    if (existante) {
      soumission = await prisma.soumission.update({ where: { id: existante.id }, data: donnees });

      if (donneesFichier.fichierChemin && existante.fichierChemin) {
        await supabaseAdmin.storage.from(BUCKET_RENDUS_DEVOIRS).remove([existante.fichierChemin]);
      }
    } else {
      soumission = await prisma.soumission.create({ data: { exerciceId, eleveId, ...donnees } });
    }
  } catch (err) {
    if (donneesFichier.fichierChemin) {
      await supabaseAdmin.storage.from(BUCKET_RENDUS_DEVOIRS).remove([donneesFichier.fichierChemin]);
    }
    throw err;
  }

  const eleve = await prisma.user.findUnique({ where: { id: eleveId }, select: { nom: true } });
  await notifierProfs(
    `${eleve?.nom ?? "Un élève"} a soumis « ${exercice.titre} » (${exercice.cours.titre})`,
    "/prof/devoirs"
  );

  return { soumission, reussiAuto: reussiAuto ?? null };
}

export async function obtenirSoumissionEleve(exerciceId: string, eleveId: string) {
  return prisma.soumission.findFirst({
    where: { exerciceId, eleveId },
  });
}

export async function obtenirSoumissionAvecAcces(id: string) {
  return prisma.soumission.findUnique({ where: { id } });
}

const SOUMISSION_AVEC_CONTEXTE = {
  eleve: { select: { id: true, nom: true } },
  exercice: {
    select: {
      id: true,
      titre: true,
      points: true,
      type: true,
      sortieAttendue: true,
      cours: { select: { id: true, titre: true, slug: true, niveau: true } },
    },
  },
} as const;

export async function listerSoumissionsACorriger() {
  return prisma.soumission.findMany({
    where: { corrigeManuellement: false },
    include: SOUMISSION_AVEC_CONTEXTE,
    orderBy: { createdAt: "asc" },
  });
}

export async function compterSoumissionsACorriger() {
  return prisma.soumission.count({ where: { corrigeManuellement: false } });
}

export async function listerSoumissionsRecentes(limit = 5) {
  return prisma.soumission.findMany({
    take: limit,
    include: SOUMISSION_AVEC_CONTEXTE,
    orderBy: { createdAt: "desc" },
  });
}

export async function listerNotesEleve(eleveId: string) {
  return prisma.soumission.findMany({
    where: { eleveId, corrigeManuellement: true },
    include: SOUMISSION_AVEC_CONTEXTE,
    orderBy: { createdAt: "desc" },
  });
}

export async function noterSoumission(
  id: string,
  { note, feedback }: { note: number; feedback?: string }
) {
  const soumission = await prisma.soumission.findUnique({
    where: { id },
    include: { exercice: { select: { points: true } } },
  });

  if (!soumission) {
    throw new SoumissionError("Rendu introuvable.");
  }

  if (!Number.isFinite(note) || note < 0 || note > soumission.exercice.points) {
    throw new SoumissionError(`La note doit être comprise entre 0 et ${soumission.exercice.points}.`);
  }

  return prisma.soumission.update({
    where: { id },
    data: {
      note,
      feedback: feedback?.trim() ? feedback.trim() : null,
      corrigeManuellement: true,
      reussi: note >= soumission.exercice.points / 2,
    },
  });
}

export async function creerUrlTelechargementSoumission(
  soumission: { fichierChemin: string | null; fichierNom: string | null },
  options?: { inline?: boolean }
) {
  if (!soumission.fichierChemin || !soumission.fichierNom) {
    throw new SoumissionError("Aucun fichier déposé.");
  }

  const signedOptions = options?.inline ? undefined : { download: soumission.fichierNom };

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_RENDUS_DEVOIRS)
    .createSignedUrl(soumission.fichierChemin, 300, signedOptions);

  if (error || !data) {
    throw new SoumissionError("Impossible de générer le lien de téléchargement.");
  }

  return data.signedUrl;
}
