"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  TentativeError,
  demarrerTentative,
  repondre,
  type ResultatReponse,
  type QuestionPourEleve,
} from "@/lib/quiz";

async function eleveConnecte() {
  const session = await auth();
  if (session?.user?.role !== "ELEVE") return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, classe: { select: { niveau: true } } },
  });
  if (!user?.classe) return null;

  return { id: user.id, niveau: user.classe.niveau };
}

export type DemarrerResultat =
  | { ok: true; tentativeId: string; question: QuestionPourEleve }
  | { ok: false; erreur: string };

export async function demarrerTentativeAction(quizId: string): Promise<DemarrerResultat> {
  const eleve = await eleveConnecte();
  if (!eleve) {
    return { ok: false, erreur: "Accès réservé aux élèves." };
  }

  try {
    const { tentativeId, question } = await demarrerTentative(quizId, eleve.id, eleve.niveau);
    return { ok: true, tentativeId, question };
  } catch (error) {
    if (error instanceof TentativeError) return { ok: false, erreur: error.message };
    throw error;
  }
}

export type RepondreResultat =
  | { ok: true; resultat: ResultatReponse }
  | { ok: false; erreur: string };

export async function repondreAction(
  tentativeId: string,
  questionId: string,
  reponseDonnee: number | null,
  tempsMs: number
): Promise<RepondreResultat> {
  const eleve = await eleveConnecte();
  if (!eleve) {
    return { ok: false, erreur: "Accès réservé aux élèves." };
  }

  try {
    const resultat = await repondre(tentativeId, eleve.id, questionId, reponseDonnee, tempsMs);
    return { ok: true, resultat };
  } catch (error) {
    if (error instanceof TentativeError) return { ok: false, erreur: error.message };
    throw error;
  }
}
