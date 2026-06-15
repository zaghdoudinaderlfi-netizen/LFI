import { randomUUID } from "crypto";
import { ModeRemiseFormulaire, TypeExercice } from "@prisma/client";
import { prisma } from "./prisma";
import { supabaseAdmin, BUCKET_PIECES_JOINTES, BUCKET_RENDUS_DEVOIRS } from "./supabase";
import { notifierProfs } from "./notifications";
import { remplirFormulaire, FormulaireError } from "./formulaires";
import { estTypeExerciceCode } from "./exercices-code";
import { MAX_COEQUIPIERS, type CamaradeClasse } from "./groupes";
import { formaterNomComplet } from "./utilisateurs";

export class SoumissionError extends Error {}

export const TAILLE_MAX_OCTETS = 10 * 1024 * 1024; // 10 Mo

export { MAX_COEQUIPIERS };

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

export type { CamaradeClasse };

// Liste des autres élèves de la classe de `eleveId`, pour le sélecteur de
// coéquipiers au moment de rendre un devoir.
export async function listerCamaradesClasse(eleveId: string): Promise<CamaradeClasse[]> {
  const eleve = await prisma.user.findUnique({ where: { id: eleveId }, select: { classeId: true } });
  if (!eleve?.classeId) return [];

  return prisma.user.findMany({
    where: { classeId: eleve.classeId, role: "ELEVE", id: { not: eleveId } },
    select: { id: true, nom: true, prenom: true },
    orderBy: { nom: "asc" },
  });
}

const MEMBRE_AVEC_ELEVE = {
  eleve: { select: { id: true, nom: true, prenom: true, avatarStyle: true, avatarOptions: true } },
  membres: {
    include: { eleve: { select: { id: true, nom: true, prenom: true, avatarStyle: true, avatarOptions: true } } },
  },
} as const;

// Vérifie que les coéquipiers choisis sont valides (classe, nombre, pas déjà
// dans un autre groupe pour ce devoir) et renvoie la liste dédupliquée des
// identifiants à enregistrer dans MembreGroupe.
async function validerCoequipiers(
  exerciceId: string,
  eleveId: string,
  classeId: string | null,
  coequipierIds: string[],
  soumissionExistanteId?: string
): Promise<string[]> {
  const idsUniques = [...new Set(coequipierIds)].filter((id) => id !== eleveId);

  if (idsUniques.length === 0) {
    // Un coéquipier (membre passif d'un autre groupe pour ce devoir) ne peut
    // pas créer son propre rendu séparé : seul l'auteur du groupe dépose.
    if (!soumissionExistanteId) {
      const groupeExistant = await prisma.soumission.findFirst({
        where: { exerciceId, membres: { some: { eleveId } } },
        select: { eleve: { select: { nom: true, prenom: true } } },
      });
      if (groupeExistant) {
        const nomAuteur = formaterNomComplet(groupeExistant.eleve);
        throw new SoumissionError(
          `Tu fais déjà partie du groupe de ${nomAuteur} pour ce devoir. C'est à ${nomAuteur} de déposer le rendu du groupe.`
        );
      }
    }
    return [];
  }

  if (idsUniques.length > MAX_COEQUIPIERS) {
    throw new SoumissionError(`Un groupe ne peut pas compter plus de ${MAX_COEQUIPIERS + 1} élèves.`);
  }

  if (!classeId) {
    throw new SoumissionError("Tu n'es rattaché à aucune classe.");
  }

  const camarades = await prisma.user.findMany({
    where: { id: { in: idsUniques }, classeId, role: "ELEVE" },
    select: { id: true, nom: true },
  });

  if (camarades.length !== idsUniques.length) {
    throw new SoumissionError("Un des coéquipiers sélectionnés n'appartient pas à ta classe.");
  }

  const idsAVerifier = [...idsUniques, eleveId];
  const conflits = await prisma.soumission.findMany({
    where: {
      exerciceId,
      ...(soumissionExistanteId ? { id: { not: soumissionExistanteId } } : {}),
      OR: [{ eleveId: { in: idsAVerifier } }, { membres: { some: { eleveId: { in: idsAVerifier } } } }],
    },
    include: MEMBRE_AVEC_ELEVE,
  });

  for (const conflit of conflits) {
    const membresConflit = [conflit.eleve, ...conflit.membres.map((m) => m.eleve)];
    for (const id of idsAVerifier) {
      const trouve = membresConflit.find((m) => m.id === id);
      if (!trouve) continue;
      if (id === eleveId) {
        throw new SoumissionError(
          `Tu fais déjà partie du groupe de ${formaterNomComplet(conflit.eleve)} pour ce devoir. Demande-lui de te retirer de son groupe (en renvoyant sa réponse sans toi) avant de rendre seul ou avec un autre groupe.`
        );
      }
      throw new SoumissionError(
        `${formaterNomComplet(trouve)} fait déjà partie du groupe de ${formaterNomComplet(conflit.eleve)} pour ce devoir.`
      );
    }
  }

  return idsUniques;
}

// Remplace la liste des coéquipiers d'une soumission (MembreGroupe).
async function appliquerGroupe(soumissionId: string, coequipierIds: string[]) {
  await prisma.membreGroupe.deleteMany({ where: { soumissionId } });
  if (coequipierIds.length > 0) {
    await prisma.membreGroupe.createMany({
      data: coequipierIds.map((eleveId) => ({ soumissionId, eleveId })),
    });
  }
}

export async function deposerSoumission(
  exerciceId: string,
  eleveId: string,
  fichier: File,
  coequipierIds: string[] = []
) {
  const exercice = await prisma.exercice.findUnique({
    where: { id: exerciceId },
    include: { cours: { select: { titre: true } } },
  });
  // Dépôt de fichier : devoirs "Envoi de fichier", ou PDF-formulaire en mode
  // "Téléchargement" (l'élève dépose le PDF rempli avec son propre lecteur).
  const modeAccepte =
    exercice?.type === TypeExercice.DEVOIR_PDF ||
    (exercice?.type === TypeExercice.DEVOIR_PDF_FORMULAIRE &&
      exercice.modeRemise === ModeRemiseFormulaire.TELECHARGEMENT);
  if (!exercice || !modeAccepte) {
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

  const eleve = await prisma.user.findUnique({
    where: { id: eleveId },
    select: { nom: true, prenom: true, classeId: true },
  });

  const existanteAvant = await prisma.soumission.findFirst({ where: { exerciceId, eleveId } });
  const coequipiers = await validerCoequipiers(
    exerciceId,
    eleveId,
    eleve?.classeId ?? null,
    coequipierIds,
    existanteAvant?.id
  );

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

  const donneesFichier = {
    fichierNom: fichier.name,
    fichierChemin: chemin,
    fichierTaille: fichier.size,
    fichierTypeMime: fichier.type || "application/octet-stream",
  };

  let soumission;

  try {
    if (existanteAvant) {
      soumission = await prisma.soumission.update({
        where: { id: existanteAvant.id },
        data: donneesFichier,
      });

      if (existanteAvant.fichierChemin) {
        await supabaseAdmin.storage.from(BUCKET_RENDUS_DEVOIRS).remove([existanteAvant.fichierChemin]);
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

  await appliquerGroupe(soumission.id, coequipiers);

  await notifierProfs(
    `${eleve ? formaterNomComplet(eleve) : "Un élève"} a déposé « ${exercice.titre} » (${exercice.cours.titre})`,
    "/prof/devoirs"
  );

  return soumission;
}

// Devoir "PDF-formulaire" : remplit le PDF déposé par le prof avec les réponses
// de l'élève et enregistre le résultat comme rendu.
export async function deposerSoumissionFormulaire(
  exerciceId: string,
  eleveId: string,
  reponses: Record<string, string | boolean>,
  coequipierIds: string[] = []
) {
  const exercice = await prisma.exercice.findUnique({
    where: { id: exerciceId },
    include: { cours: { select: { titre: true } } },
  });
  if (!exercice || exercice.type !== TypeExercice.DEVOIR_PDF_FORMULAIRE) {
    throw new SoumissionError("Devoir introuvable.");
  }

  if (exercice.modeRemise !== ModeRemiseFormulaire.EN_LIGNE) {
    throw new SoumissionError("Ce devoir se rend par dépôt de fichier (mode téléchargement).");
  }

  if (!exercice.sujetChemin || !exercice.sujetNom) {
    throw new SoumissionError("Ce devoir n'a pas encore de formulaire PDF.");
  }

  const eleve = await prisma.user.findUnique({
    where: { id: eleveId },
    select: { nom: true, prenom: true, classeId: true },
  });

  const existanteAvant = await prisma.soumission.findFirst({ where: { exerciceId, eleveId } });
  const coequipiers = await validerCoequipiers(
    exerciceId,
    eleveId,
    eleve?.classeId ?? null,
    coequipierIds,
    existanteAvant?.id
  );

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

  const donnees = {
    contenu: JSON.stringify(reponses),
    fichierNom,
    fichierChemin: chemin,
    fichierTaille: pdfRempli.byteLength,
    fichierTypeMime: "application/pdf",
  };

  let soumission;

  try {
    if (existanteAvant) {
      soumission = await prisma.soumission.update({
        where: { id: existanteAvant.id },
        data: donnees,
      });

      if (existanteAvant.fichierChemin) {
        await supabaseAdmin.storage.from(BUCKET_RENDUS_DEVOIRS).remove([existanteAvant.fichierChemin]);
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

  await appliquerGroupe(soumission.id, coequipiers);

  await notifierProfs(
    `${eleve ? formaterNomComplet(eleve) : "Un élève"} a déposé « ${exercice.titre} » (${exercice.cours.titre})`,
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

  const eleve = await prisma.user.findUnique({ where: { id: eleveId }, select: { nom: true, prenom: true } });
  await notifierProfs(
    `${eleve ? formaterNomComplet(eleve) : "Un élève"} a soumis « ${exercice.titre} » (${exercice.cours.titre})`,
    "/prof/devoirs"
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
    include: { membres: { select: { eleveId: true } } },
  });
}

const SOUMISSION_AVEC_CONTEXTE = {
  eleve: { select: { id: true, nom: true, prenom: true, avatarStyle: true, avatarOptions: true } },
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
    where: {
      OR: [{ eleveId }, { membres: { some: { eleveId } } }],
      corrigeManuellement: true,
    },
    include: SOUMISSION_AVEC_CONTEXTE,
    orderBy: { createdAt: "desc" },
  });
}

export type LigneRosterDevoir =
  | { statut: "rendu"; soumission: SoumissionAvecGroupe; eleves: CamaradeClasse[] }
  | { statut: "attente"; eleve: CamaradeClasse };

type SoumissionAvecGroupe = NonNullable<Awaited<ReturnType<typeof obtenirSoumissionEleve>>>;

// Pour la page de correction d'un devoir : la liste des élèves d'une classe
// avec leur état de rendu. Les membres d'un même groupe apparaissent ensemble
// sur une seule ligne.
export async function listerRosterDevoir(exerciceId: string, classeId: string): Promise<LigneRosterDevoir[]> {
  const [eleves, soumissions] = await Promise.all([
    prisma.user.findMany({
      where: { classeId, role: "ELEVE" },
      select: { id: true, nom: true, prenom: true, avatarStyle: true, avatarOptions: true },
      orderBy: { nom: "asc" },
    }),
    prisma.soumission.findMany({
      where: { exerciceId },
      include: MEMBRE_AVEC_ELEVE,
    }),
  ]);

  const soumissionParEleve = new Map<string, SoumissionAvecGroupe>();
  for (const s of soumissions) {
    soumissionParEleve.set(s.eleveId, s);
    for (const m of s.membres) soumissionParEleve.set(m.eleveId, s);
  }

  const dejaAffiches = new Set<string>();
  const lignes: LigneRosterDevoir[] = [];

  for (const eleve of eleves) {
    if (dejaAffiches.has(eleve.id)) continue;

    const soumission = soumissionParEleve.get(eleve.id);
    if (soumission) {
      const membresGroupe = [soumission.eleve, ...soumission.membres.map((m) => m.eleve)];
      for (const membre of membresGroupe) dejaAffiches.add(membre.id);
      lignes.push({ statut: "rendu", soumission, eleves: membresGroupe });
    } else {
      dejaAffiches.add(eleve.id);
      lignes.push({ statut: "attente", eleve });
    }
  }

  return lignes;
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
