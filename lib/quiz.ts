import { Matiere, Niveau, QuestionQuiz } from "@prisma/client";
import { prisma } from "./prisma";
import { formaterNomComplet } from "./utilisateurs";
import { MATIERE_PAR_NIVEAU } from "./classes-constants";

export class QuizError extends Error {}
export class TentativeError extends Error {}

type QuizInfoInput = {
  titre: string;
  niveau: Niveau;
  matiere: Matiere;
  chapitre?: number | null;
  visibleEleves: boolean;
};

function validerQuizInput(data: QuizInfoInput) {
  if (!data.titre.trim()) {
    throw new QuizError("Le titre est obligatoire.");
  }
}

export async function creerQuiz(auteurId: string, data: QuizInfoInput) {
  validerQuizInput(data);

  return prisma.quiz.create({
    data: {
      titre: data.titre.trim(),
      niveau: data.niveau,
      matiere: data.matiere,
      chapitre: data.chapitre ?? null,
      visibleEleves: data.visibleEleves,
      auteurId,
    },
  });
}

export async function modifierQuiz(id: string, data: QuizInfoInput) {
  validerQuizInput(data);

  const quiz = await prisma.quiz.findUnique({ where: { id } });
  if (!quiz) {
    throw new QuizError("Quiz introuvable.");
  }

  return prisma.quiz.update({
    where: { id },
    data: {
      titre: data.titre.trim(),
      niveau: data.niveau,
      matiere: data.matiere,
      chapitre: data.chapitre ?? null,
      visibleEleves: data.visibleEleves,
    },
  });
}

export async function basculerVisibiliteQuiz(id: string, visible: boolean) {
  return prisma.quiz.update({
    where: { id },
    data: { visibleEleves: visible },
  });
}

export async function supprimerQuiz(id: string) {
  const quiz = await prisma.quiz.findUnique({ where: { id } });
  if (!quiz) {
    throw new QuizError("Quiz introuvable.");
  }

  // onDelete: Cascade sur QuestionQuiz et TentativeQuiz.
  await prisma.quiz.delete({ where: { id } });
}

export async function listerQuizProf() {
  return prisma.quiz.findMany({
    include: { _count: { select: { questions: true, tentatives: true } } },
    orderBy: [{ niveau: "asc" }, { matiere: "asc" }, { chapitre: "asc" }, { createdAt: "desc" }],
  });
}

export async function obtenirQuizParId(id: string) {
  return prisma.quiz.findUnique({
    where: { id },
    include: { questions: { orderBy: { ordre: "asc" } } },
  });
}

// ───────────────────────────────────────────────
//  QUESTIONS
// ───────────────────────────────────────────────

export type QuestionInput = {
  enonce: string;
  choixA: string;
  choixB: string;
  choixC: string;
  choixD: string;
  bonneReponse: number; // 0=A, 1=B, 2=C, 3=D
  tempsLimiteSec: number;
};

function validerQuestionInput(data: QuestionInput) {
  if (!data.enonce.trim()) {
    throw new QuizError("L'énoncé de la question est obligatoire.");
  }
  if (!data.choixA.trim() || !data.choixB.trim() || !data.choixC.trim() || !data.choixD.trim()) {
    throw new QuizError("Les 4 choix de réponse sont obligatoires.");
  }
  if (![0, 1, 2, 3].includes(data.bonneReponse)) {
    throw new QuizError("La bonne réponse doit être A, B, C ou D.");
  }
  if (!Number.isFinite(data.tempsLimiteSec) || data.tempsLimiteSec < 5 || data.tempsLimiteSec > 120) {
    throw new QuizError("Le temps limite doit être compris entre 5 et 120 secondes.");
  }
}

async function prochainOrdre(quizId: string) {
  const dernier = await prisma.questionQuiz.findFirst({
    where: { quizId },
    orderBy: { ordre: "desc" },
    select: { ordre: true },
  });
  return (dernier?.ordre ?? -1) + 1;
}

export async function ajouterQuestion(quizId: string, data: QuestionInput) {
  validerQuestionInput(data);

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) {
    throw new QuizError("Quiz introuvable.");
  }

  const ordre = await prochainOrdre(quizId);

  return prisma.questionQuiz.create({
    data: {
      quizId,
      enonce: data.enonce.trim(),
      choixA: data.choixA.trim(),
      choixB: data.choixB.trim(),
      choixC: data.choixC.trim(),
      choixD: data.choixD.trim(),
      bonneReponse: data.bonneReponse,
      tempsLimiteSec: data.tempsLimiteSec,
      ordre,
    },
  });
}

export async function supprimerQuestion(id: string) {
  await prisma.questionQuiz.delete({ where: { id } });
}

// ───────────────────────────────────────────────
//  IMPORT CSV/TEXTE
// ───────────────────────────────────────────────
//
// Format attendu, une ligne = une question :
//   question;choixA;choixB;choixC;choixD;numeroBonneReponse;tempsEnSecondes
// - numeroBonneReponse : 1, 2, 3 ou 4 (correspond à A, B, C, D)
// - tempsEnSecondes : optionnel, 20 par défaut

export type LigneImportValide = QuestionInput & { ligne: number };
export type LigneImportInvalide = { ligne: number; brut: string; raison: string };
export type ResultatImportCSV = {
  valides: LigneImportValide[];
  invalides: LigneImportInvalide[];
};

const NB_CHAMPS_ATTENDU = 7;
const TEMPS_LIMITE_DEFAUT = 20;

export function parserQuestionsCSV(texte: string): ResultatImportCSV {
  const valides: LigneImportValide[] = [];
  const invalides: LigneImportInvalide[] = [];

  const lignesBrutes = texte
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  lignesBrutes.forEach((brut, index) => {
    const numeroLigne = index + 1;
    const champs = brut.split(";").map((c) => c.trim());

    // La 1ère ligne peut être un en-tête ("question;choixA;...") : on
    // l'ignore silencieusement si le champ bonneReponse n'est pas un nombre.
    if (index === 0 && champs.length >= 6 && !/^[1-4]$/.test(champs[5])) {
      return;
    }

    if (champs.length !== NB_CHAMPS_ATTENDU) {
      invalides.push({
        ligne: numeroLigne,
        brut,
        raison: `${NB_CHAMPS_ATTENDU} champs attendus (question;choixA;choixB;choixC;choixD;bonneReponse;temps), ${champs.length} trouvé(s).`,
      });
      return;
    }

    const [enonce, choixA, choixB, choixC, choixD, bonneReponseBrut, tempsBrut] = champs;

    if (!enonce) {
      invalides.push({ ligne: numeroLigne, brut, raison: "La question est vide." });
      return;
    }
    if (!choixA || !choixB || !choixC || !choixD) {
      invalides.push({ ligne: numeroLigne, brut, raison: "Les 4 choix (A, B, C, D) doivent être renseignés." });
      return;
    }

    const numeroBonneReponse = parseInt(bonneReponseBrut, 10);
    if (!Number.isInteger(numeroBonneReponse) || numeroBonneReponse < 1 || numeroBonneReponse > 4) {
      invalides.push({
        ligne: numeroLigne,
        brut,
        raison: `La bonne réponse doit être 1, 2, 3 ou 4 (trouvé : "${bonneReponseBrut}").`,
      });
      return;
    }

    const tempsLimiteSec = tempsBrut ? parseInt(tempsBrut, 10) : TEMPS_LIMITE_DEFAUT;
    if (!Number.isInteger(tempsLimiteSec) || tempsLimiteSec < 5 || tempsLimiteSec > 120) {
      invalides.push({
        ligne: numeroLigne,
        brut,
        raison: `Le temps doit être un nombre entre 5 et 120 secondes (trouvé : "${tempsBrut}").`,
      });
      return;
    }

    valides.push({
      ligne: numeroLigne,
      enonce,
      choixA,
      choixB,
      choixC,
      choixD,
      bonneReponse: numeroBonneReponse - 1,
      tempsLimiteSec,
    });
  });

  return { valides, invalides };
}

export async function importerQuestions(quizId: string, lignes: LigneImportValide[]) {
  if (lignes.length === 0) {
    throw new QuizError("Aucune question valide à importer.");
  }

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) {
    throw new QuizError("Quiz introuvable.");
  }

  // Revalidation défensive : on ne fait pas confiance à l'aperçu envoyé par
  // le client, chaque ligne repasse par les mêmes règles que le formulaire.
  for (const ligne of lignes) {
    validerQuestionInput(ligne);
  }

  let ordre = await prochainOrdre(quizId);

  await prisma.questionQuiz.createMany({
    data: lignes.map((l) => ({
      quizId,
      enonce: l.enonce.trim(),
      choixA: l.choixA.trim(),
      choixB: l.choixB.trim(),
      choixC: l.choixC.trim(),
      choixD: l.choixD.trim(),
      bonneReponse: l.bonneReponse,
      tempsLimiteSec: l.tempsLimiteSec,
      ordre: ordre++,
    })),
  });

  return lignes.length;
}

// ───────────────────────────────────────────────
//  CÔTÉ ÉLÈVE — LISTE ET PARTIE (mode solo)
// ───────────────────────────────────────────────

// Comme pour les cours : un élève ne doit voir que les quiz de sa propre
// section, déduite de son niveau — pas ceux d'une autre matière.
export async function listerQuizVisiblesEleve(niveau: Niveau) {
  return prisma.quiz.findMany({
    where: { niveau, matiere: MATIERE_PAR_NIVEAU[niveau], visibleEleves: true },
    include: { _count: { select: { questions: true } } },
    orderBy: [{ matiere: "asc" }, { chapitre: "asc" }, { createdAt: "asc" }],
  });
}

export async function obtenirQuizVisibleEleve(quizId: string, niveau: Niveau) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { _count: { select: { questions: true } } },
  });
  if (!quiz || !quiz.visibleEleves || quiz.niveau !== niveau || quiz.matiere !== MATIERE_PAR_NIVEAU[niveau]) {
    return null;
  }
  return quiz;
}

export async function meilleurScoreEleve(quizId: string, eleveId: string) {
  return prisma.tentativeQuiz.findFirst({
    where: { quizId, eleveId },
    orderBy: { score: "desc" },
    select: { score: true, bonnesReponses: true },
  });
}

/** Meilleur score de l'élève pour chaque quiz d'une liste (une seule requête). */
export async function meilleursScoresEleve(quizIds: string[], eleveId: string) {
  const tentatives = await prisma.tentativeQuiz.findMany({
    where: { quizId: { in: quizIds }, eleveId },
    select: { quizId: true, score: true },
    orderBy: { score: "desc" },
  });

  const meilleurs = new Map<string, number>();
  for (const t of tentatives) {
    if (!meilleurs.has(t.quizId)) meilleurs.set(t.quizId, t.score);
  }
  return meilleurs;
}

// Une question telle qu'envoyée à l'élève : jamais `bonneReponse` avant
// qu'il ait répondu, pour éviter de la lire dans le code source de la page.
export type QuestionPourEleve = {
  id: string;
  enonce: string;
  choixA: string;
  choixB: string;
  choixC: string;
  choixD: string;
  tempsLimiteSec: number;
  index: number;
  total: number;
};

function versionEleve(q: QuestionQuiz, index: number, total: number): QuestionPourEleve {
  return {
    id: q.id,
    enonce: q.enonce,
    choixA: q.choixA,
    choixB: q.choixB,
    choixC: q.choixC,
    choixD: q.choixD,
    tempsLimiteSec: q.tempsLimiteSec,
    index,
    total,
  };
}

const POINTS_BASE = 500;
const POINTS_BONUS_MAX = 500;

function calculerPoints(tempsMs: number, tempsLimiteMs: number): number {
  if (tempsLimiteMs <= 0) return POINTS_BASE;
  const ratioRestant = Math.max(0, Math.min(1, (tempsLimiteMs - tempsMs) / tempsLimiteMs));
  return POINTS_BASE + Math.round(POINTS_BONUS_MAX * ratioRestant);
}

// Multiplicateur de série : compte la bonne réponse en cours, donc une série
// de 3 (dont celle qui vient d'être validée) profite déjà du bonus x1.2.
export function multiplicateurSerie(serie: number): number {
  if (serie >= 8) return 2;
  if (serie >= 5) return 1.5;
  if (serie >= 3) return 1.2;
  return 1;
}

export async function demarrerTentative(quizId: string, eleveId: string, niveauEleve: Niveau) {
  const quiz = await obtenirQuizVisibleEleve(quizId, niveauEleve);
  if (!quiz) {
    throw new TentativeError("Ce quiz n'est pas disponible.");
  }
  if (quiz._count.questions === 0) {
    throw new TentativeError("Ce quiz n'a pas encore de questions.");
  }

  const tentative = await prisma.tentativeQuiz.create({
    data: { quizId, eleveId },
  });

  const premiereQuestion = await prisma.questionQuiz.findFirst({
    where: { quizId },
    orderBy: { ordre: "asc" },
  });

  return {
    tentativeId: tentative.id,
    question: versionEleve(premiereQuestion!, 1, quiz._count.questions),
  };
}

export type ClassementLigne = {
  rang: number;
  eleveId: string;
  nom: string;
  score: number;
};

export type ClassementQuiz = {
  classement: ClassementLigne[];
  positionEleve: ClassementLigne | null;
};

export async function classementQuiz(quizId: string, eleveId: string): Promise<ClassementQuiz> {
  const eleve = await prisma.user.findUnique({ where: { id: eleveId }, select: { classeId: true } });

  const tentatives = await prisma.tentativeQuiz.findMany({
    where: {
      quizId,
      eleve: eleve?.classeId ? { classeId: eleve.classeId } : { id: eleveId },
    },
    include: { eleve: { select: { id: true, nom: true, prenom: true } } },
    orderBy: { score: "desc" },
  });

  const meilleurParEleve = new Map<string, (typeof tentatives)[number]>();
  for (const t of tentatives) {
    const existant = meilleurParEleve.get(t.eleveId);
    if (!existant || t.score > existant.score) meilleurParEleve.set(t.eleveId, t);
  }

  const classement: ClassementLigne[] = [...meilleurParEleve.values()]
    .sort((a, b) => b.score - a.score)
    .map((t, i) => ({
      rang: i + 1,
      eleveId: t.eleveId,
      nom: formaterNomComplet(t.eleve),
      score: t.score,
    }));

  const positionEleve = classement.find((c) => c.eleveId === eleveId) ?? null;

  return { classement, positionEleve };
}

// ───────────────────────────────────────────────
//  CÔTÉ PROF — RÉSULTATS
// ───────────────────────────────────────────────

export type ResultatEleve = {
  eleveId: string;
  nom: string;
  meilleurScore: number;
  nbParties: number;
  meilleureSerie: number;
};

/** Meilleur score et nombre de parties jouées, par élève. */
export async function resultatsQuizParEleve(quizId: string): Promise<ResultatEleve[]> {
  const tentatives = await prisma.tentativeQuiz.findMany({
    where: { quizId },
    include: { eleve: { select: { id: true, nom: true, prenom: true } } },
  });

  const parEleve = new Map<string, ResultatEleve>();
  for (const t of tentatives) {
    const existant = parEleve.get(t.eleveId);
    if (existant) {
      existant.nbParties += 1;
      existant.meilleurScore = Math.max(existant.meilleurScore, t.score);
      existant.meilleureSerie = Math.max(existant.meilleureSerie, t.serieMax);
    } else {
      parEleve.set(t.eleveId, {
        eleveId: t.eleveId,
        nom: formaterNomComplet(t.eleve),
        meilleurScore: t.score,
        nbParties: 1,
        meilleureSerie: t.serieMax,
      });
    }
  }

  return [...parEleve.values()].sort((a, b) => b.meilleurScore - a.meilleurScore);
}

export type StatQuestion = {
  id: string;
  enonce: string;
  nbReponses: number;
  nbCorrectes: number;
  tauxReussite: number; // 0-100 ; 0 par défaut si personne n'a répondu
};

// Classement du plus raté au moins raté : une question jamais tentée
// (nbReponses = 0) n'est pas "ratée", elle est sans donnée — reléguée en fin
// de liste plutôt que mélangée avec les vrais 0% de réussite.
function trierParTauxCroissant<T extends { tauxReussite: number; nbReponses: number }>(stats: T[]): T[] {
  return [...stats].sort((a, b) => {
    if (a.nbReponses === 0 && b.nbReponses === 0) return 0;
    if (a.nbReponses === 0) return 1;
    if (b.nbReponses === 0) return -1;
    return a.tauxReussite - b.tauxReussite;
  });
}

/** Taux de bonnes réponses par question, classé du plus raté au moins raté. */
export async function statsQuestionsQuiz(quizId: string): Promise<StatQuestion[]> {
  const questions = await prisma.questionQuiz.findMany({
    where: { quizId },
    orderBy: { ordre: "asc" },
    include: { reponses: { select: { correct: true } } },
  });

  const stats = questions.map((q) => {
    const nbReponses = q.reponses.length;
    const nbCorrectes = q.reponses.filter((r) => r.correct).length;
    return {
      id: q.id,
      enonce: q.enonce,
      nbReponses,
      nbCorrectes,
      tauxReussite: nbReponses > 0 ? Math.round((nbCorrectes / nbReponses) * 100) : 0,
    };
  });

  return trierParTauxCroissant(stats);
}

export type StatQuestionGlobale = StatQuestion & {
  quizId: string;
  quizTitre: string;
  niveau: Niveau;
  matiere: Matiere;
  chapitre: number | null;
};

const NB_QUESTIONS_RATEES_GLOBAL = 15;

/**
 * Questions les plus ratées tous quiz confondus (limité aux
 * NB_QUESTIONS_RATEES_GLOBAL pires) — pour la page Statistiques prof.
 * N'inclut que les questions ayant reçu au moins une réponse : une question
 * jamais jouée n'est pas "ratée", elle manque simplement de données.
 */
export async function statsQuestionsRateesGlobal(): Promise<StatQuestionGlobale[]> {
  const quizzes = await prisma.quiz.findMany({
    include: { questions: { include: { reponses: { select: { correct: true } } } } },
  });

  const stats: StatQuestionGlobale[] = [];
  for (const quiz of quizzes) {
    for (const q of quiz.questions) {
      const nbReponses = q.reponses.length;
      if (nbReponses === 0) continue;
      const nbCorrectes = q.reponses.filter((r) => r.correct).length;
      stats.push({
        id: q.id,
        enonce: q.enonce,
        nbReponses,
        nbCorrectes,
        tauxReussite: Math.round((nbCorrectes / nbReponses) * 100),
        quizId: quiz.id,
        quizTitre: quiz.titre,
        niveau: quiz.niveau,
        matiere: quiz.matiere,
        chapitre: quiz.chapitre,
      });
    }
  }

  return trierParTauxCroissant(stats).slice(0, NB_QUESTIONS_RATEES_GLOBAL);
}

export type ResultatReponse = {
  correct: boolean;
  bonneReponse: number;
  pointsObtenus: number;
  scoreTotal: number;
  bonnesReponsesTotal: number;
  serieActuelle: number;
  serieMax: number;
  multiplicateur: number;
  questionSuivante: QuestionPourEleve | null;
  terminee: boolean;
  classement?: ClassementQuiz;
};

export async function repondre(
  tentativeId: string,
  eleveId: string,
  questionId: string,
  reponseDonnee: number | null,
  tempsMs: number
): Promise<ResultatReponse> {
  const tentative = await prisma.tentativeQuiz.findUnique({ where: { id: tentativeId } });
  if (!tentative || tentative.eleveId !== eleveId) {
    throw new TentativeError("Tentative introuvable.");
  }

  const question = await prisma.questionQuiz.findUnique({ where: { id: questionId } });
  if (!question || question.quizId !== tentative.quizId) {
    throw new TentativeError("Question introuvable.");
  }

  const dejaRepondu = await prisma.reponseTentative.findUnique({
    where: { tentativeId_questionId: { tentativeId, questionId } },
  });
  if (dejaRepondu) {
    throw new TentativeError("Cette question a déjà une réponse enregistrée.");
  }

  if (reponseDonnee !== null && ![0, 1, 2, 3].includes(reponseDonnee)) {
    throw new TentativeError("Réponse invalide.");
  }

  const tempsLimiteMs = question.tempsLimiteSec * 1000;
  const tempsClampe = Math.min(Math.max(Math.round(tempsMs), 0), tempsLimiteMs);

  const correct = reponseDonnee !== null && reponseDonnee === question.bonneReponse;

  // La série compte la réponse en cours : une mauvaise réponse (ou un temps
  // écoulé) la remet à zéro immédiatement, une bonne réponse l'incrémente
  // avant de déterminer le multiplicateur applicable à CETTE réponse.
  const nouvelleSerie = correct ? tentative.serieActuelle + 1 : 0;
  const multiplicateur = correct ? multiplicateurSerie(nouvelleSerie) : 1;
  const nouveauSerieMax = Math.max(tentative.serieMax, nouvelleSerie);
  const pointsObtenus = correct ? Math.round(calculerPoints(tempsClampe, tempsLimiteMs) * multiplicateur) : 0;

  const [, tentativeMaj] = await prisma.$transaction([
    prisma.reponseTentative.create({
      data: {
        tentativeId,
        questionId,
        reponseDonnee,
        correct,
        tempsMs: tempsClampe,
        pointsObtenus,
        multiplicateurSerie: multiplicateur,
      },
    }),
    prisma.tentativeQuiz.update({
      where: { id: tentativeId },
      data: {
        score: { increment: pointsObtenus },
        bonnesReponses: { increment: correct ? 1 : 0 },
        serieActuelle: nouvelleSerie,
        serieMax: nouveauSerieMax,
      },
    }),
  ]);

  const toutesLesQuestions = await prisma.questionQuiz.findMany({
    where: { quizId: tentative.quizId },
    orderBy: { ordre: "asc" },
    select: { id: true },
  });
  const indexActuel = toutesLesQuestions.findIndex((q) => q.id === questionId);
  const suivante = toutesLesQuestions[indexActuel + 1] ?? null;

  let questionSuivante: QuestionPourEleve | null = null;
  if (suivante) {
    const q = await prisma.questionQuiz.findUnique({ where: { id: suivante.id } });
    questionSuivante = versionEleve(q!, indexActuel + 2, toutesLesQuestions.length);
  }

  const terminee = !suivante;

  return {
    correct,
    bonneReponse: question.bonneReponse,
    pointsObtenus,
    scoreTotal: tentativeMaj.score,
    bonnesReponsesTotal: tentativeMaj.bonnesReponses,
    serieActuelle: tentativeMaj.serieActuelle,
    serieMax: tentativeMaj.serieMax,
    multiplicateur,
    questionSuivante,
    terminee,
    classement: terminee ? await classementQuiz(tentative.quizId, eleveId) : undefined,
  };
}

// ───────────────────────────────────────────────
//  CÔTÉ PROF — STATISTIQUES PAR CLASSE / CHAPITRE
// ───────────────────────────────────────────────

export type StatClasseChapitre = {
  classeId: string;
  classeNom: string;
  niveau: Niveau;
  matiere: Matiere;
  chapitre: number | null;
  tauxReussiteMoyen: number; // 0-100, moyenne du % de bonnes réponses par tentative
  nbTentatives: number;
};

/**
 * Score moyen (% de bonnes réponses) par classe et par chapitre, toutes
 * tentatives confondues, trié du plus faible au plus fort — pour repérer
 * rapidement quelle classe a le plus besoin d'insister sur quel chapitre.
 * Le score gamifié (TentativeQuiz.score, avec bonus de vitesse/série) n'est
 * pas utilisé ici : c'est un score de jeu, pas une mesure pédagogique
 * comparable d'une tentative à l'autre.
 */
export async function statsScoreMoyenParClasseEtChapitre(): Promise<StatClasseChapitre[]> {
  const tentatives = await prisma.tentativeQuiz.findMany({
    select: {
      bonnesReponses: true,
      quiz: {
        select: { chapitre: true, niveau: true, matiere: true, _count: { select: { questions: true } } },
      },
      eleve: { select: { classeId: true, classe: { select: { nom: true } } } },
    },
  });

  type Groupe = {
    classeId: string;
    classeNom: string;
    niveau: Niveau;
    matiere: Matiere;
    chapitre: number | null;
    sommeTaux: number;
    nb: number;
  };
  const groupes = new Map<string, Groupe>();

  for (const t of tentatives) {
    const nbQuestions = t.quiz._count.questions;
    if (!t.eleve.classeId || !t.eleve.classe || nbQuestions === 0) continue;

    const taux = (t.bonnesReponses / nbQuestions) * 100;
    const cle = `${t.eleve.classeId}|${t.quiz.chapitre ?? "none"}|${t.quiz.niveau}|${t.quiz.matiere}`;

    const existant = groupes.get(cle);
    if (existant) {
      existant.sommeTaux += taux;
      existant.nb += 1;
    } else {
      groupes.set(cle, {
        classeId: t.eleve.classeId,
        classeNom: t.eleve.classe.nom,
        niveau: t.quiz.niveau,
        matiere: t.quiz.matiere,
        chapitre: t.quiz.chapitre,
        sommeTaux: taux,
        nb: 1,
      });
    }
  }

  return [...groupes.values()]
    .map((g) => ({
      classeId: g.classeId,
      classeNom: g.classeNom,
      niveau: g.niveau,
      matiere: g.matiere,
      chapitre: g.chapitre,
      tauxReussiteMoyen: Math.round(g.sommeTaux / g.nb),
      nbTentatives: g.nb,
    }))
    .sort((a, b) => a.tauxReussiteMoyen - b.tauxReussiteMoyen);
}

export type ApercuStatistiques = {
  totalTentatives: number;
  tauxReussiteMoyenGlobal: number;
  nbQuizActifs: number;
};

/** Chiffres clés affichés en tête de la page Statistiques prof. */
export async function apercuStatistiques(): Promise<ApercuStatistiques> {
  const [tentatives, nbQuizActifs] = await Promise.all([
    prisma.tentativeQuiz.findMany({
      select: { bonnesReponses: true, quiz: { select: { _count: { select: { questions: true } } } } },
    }),
    prisma.quiz.count({ where: { visibleEleves: true } }),
  ]);

  const tentativesValides = tentatives.filter((t) => t.quiz._count.questions > 0);
  const tauxReussiteMoyenGlobal =
    tentativesValides.length > 0
      ? Math.round(
          tentativesValides.reduce(
            (somme, t) => somme + (t.bonnesReponses / t.quiz._count.questions) * 100,
            0
          ) / tentativesValides.length
        )
      : 0;

  return {
    totalTentatives: tentatives.length,
    tauxReussiteMoyenGlobal,
    nbQuizActifs,
  };
}

// ───────────────────────────────────────────────
//  CÔTÉ ÉLÈVE — FLASHCARDS DE RÉVISION
// ───────────────────────────────────────────────

export type QuestionFlashcard = {
  id: string;
  enonce: string;
  bonneReponseTexte: string;
  index: number;
  total: number;
};

export type QuizFlashcards = {
  titre: string;
  questions: QuestionFlashcard[];
};

/**
 * Questions d'un quiz avec leur bonne réponse, pour le mode révision libre
 * (voir app/eleve/quiz/[id]/flashcards) — contrairement au mode jeu, la
 * réponse est envoyée directement : ce n'est pas une évaluation.
 */
export async function obtenirQuizPourFlashcards(
  quizId: string,
  niveauEleve: Niveau
): Promise<QuizFlashcards | null> {
  const quiz = await obtenirQuizVisibleEleve(quizId, niveauEleve);
  if (!quiz) return null;

  const questions = await prisma.questionQuiz.findMany({
    where: { quizId },
    orderBy: { ordre: "asc" },
  });

  const total = questions.length;
  return {
    titre: quiz.titre,
    questions: questions.map((q, i) => ({
      id: q.id,
      enonce: q.enonce,
      bonneReponseTexte: [q.choixA, q.choixB, q.choixC, q.choixD][q.bonneReponse],
      index: i + 1,
      total,
    })),
  };
}
