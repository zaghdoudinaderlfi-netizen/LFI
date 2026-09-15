import { randomUUID } from "crypto";
import { Matiere, TypeExercice } from "@prisma/client";
import { prisma } from "./prisma";
import { supabaseAdmin, BUCKET_RENDUS_DEVOIRS } from "./supabase";
import { notifierProfs, notifierEleve } from "./notifications";
import { estTypeExerciceCode } from "./exercices-code";
import { formaterNomComplet } from "./utilisateurs";

export class SoumissionError extends Error {}

export const TAILLE_MAX_OCTETS = 10 * 1024 * 1024; // 10 Mo

const MEMBRE_AVEC_ELEVE = {
  eleve: { select: { id: true, nom: true, prenom: true, avatarStyle: true, avatarOptions: true, avatarPhotoUrl: true } },
  membres: {
    include: { eleve: { select: { id: true, nom: true, prenom: true, avatarStyle: true, avatarOptions: true, avatarPhotoUrl: true } } },
  },
} as const;

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
    include: { cours: { select: { titre: true, matiere: true } } },
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

  const eleve = await prisma.user.findUnique({ where: { id: eleveId }, select: { nom: true, prenom: true } });
  await notifierProfs(
    `${eleve ? formaterNomComplet(eleve) : "Un élève"} a soumis « ${exercice.titre} » (${exercice.cours.titre})`,
    `/prof/cours/${exercice.coursId}`,
    exercice.cours.matiere
  );

  return { soumission, reussiAuto: reussiAuto ?? null };
}

// Renvoie la soumission de `eleveId` pour cet exercice, qu'il en soit
// l'auteur (eleveId) ou un coéquipier désigné (MembreGroupe).
export async function obtenirSoumissionEleve(exerciceId: string, eleveId: string) {
  return prisma.soumission.findFirst({
    where: { exerciceId, OR: [{ eleveId }, { membres: { some: { eleveId } } }] },
    include: MEMBRE_AVEC_ELEVE,
  });
}

export async function obtenirSoumissionAvecAcces(id: string) {
  return prisma.soumission.findUnique({
    where: { id },
    include: {
      membres: {
        select: {
          eleveId: true,
          eleve: { select: { nom: true, prenom: true } },
        },
      },
      eleve: { select: { id: true, nom: true, prenom: true } },
      exercice: {
        select: {
          titre: true,
          cours: { select: { titre: true } },
        },
      },
    },
  });
}

const SOUMISSION_AVEC_CONTEXTE = {
  eleve: { select: { id: true, nom: true, prenom: true, avatarStyle: true, avatarOptions: true, avatarPhotoUrl: true } },
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

export async function listerSoumissionsACorriger(matiere?: string) {
  return prisma.soumission.findMany({
    where: {
      corrigeManuellement: false,
      ...(matiere ? { exercice: { cours: { matiere: matiere as Matiere } } } : {}),
    },
    include: SOUMISSION_AVEC_CONTEXTE,
    orderBy: { createdAt: "asc" },
  });
}

export async function compterSoumissionsACorriger(matiere?: string) {
  return prisma.soumission.count({
    where: {
      corrigeManuellement: false,
      ...(matiere ? { exercice: { cours: { matiere: matiere as Matiere } } } : {}),
    },
  });
}

export async function listerSoumissionsRecentes(limit = 5, matiere?: string) {
  return prisma.soumission.findMany({
    take: limit,
    where: matiere ? { exercice: { cours: { matiere: matiere as Matiere } } } : {},
    include: SOUMISSION_AVEC_CONTEXTE,
    orderBy: { createdAt: "desc" },
  });
}

export async function listerNotesEleve(eleveId: string) {
  return prisma.soumission.findMany({
    where: {
      OR: [{ eleveId }, { membres: { some: { eleveId } } }],
      corrigeManuellement: true,
    },
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
    include: {
      exercice: {
        select: { points: true, titre: true, cours: { select: { slug: true, matiere: true } } },
      },
      membres: { select: { eleveId: true } },
    },
  });

  if (!soumission) {
    throw new SoumissionError("Rendu introuvable.");
  }

  if (!Number.isFinite(note) || note < 0 || note > soumission.exercice.points) {
    throw new SoumissionError(`La note doit être comprise entre 0 et ${soumission.exercice.points}.`);
  }

  const resultat = await prisma.soumission.update({
    where: { id },
    data: {
      note,
      feedback: feedback?.trim() ? feedback.trim() : null,
      corrigeManuellement: true,
      reussi: note >= soumission.exercice.points / 2,
    },
  });

  const destinataires = [soumission.eleveId, ...soumission.membres.map((m) => m.eleveId)];
  await Promise.all(
    destinataires.map((eleveId) =>
      notifierEleve(
        eleveId,
        `Nouvelle note : « ${soumission.exercice.titre} » — ${note}/${soumission.exercice.points}`,
        `/eleve/cours/${soumission.exercice.cours.slug}`,
        soumission.exercice.cours.matiere,
        "NOTE"
      )
    )
  );

  return resultat;
}

export async function creerUrlTelechargementSoumission(
  soumission: { fichierChemin: string | null; fichierNom: string | null },
  options?: { inline?: boolean; nomFichier?: string }
) {
  if (!soumission.fichierChemin || !soumission.fichierNom) {
    throw new SoumissionError("Aucun fichier déposé.");
  }

  const nomPourTelechargement = options?.nomFichier ?? soumission.fichierNom;
  const signedOptions = options?.inline ? undefined : { download: nomPourTelechargement };

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_RENDUS_DEVOIRS)
    .createSignedUrl(soumission.fichierChemin, 300, signedOptions);

  if (error || !data) {
    throw new SoumissionError("Impossible de générer le lien de téléchargement.");
  }

  return data.signedUrl;
}
