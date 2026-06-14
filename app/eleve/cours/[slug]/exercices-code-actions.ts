"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { obtenirExerciceCode } from "@/lib/exercices-code";
import { soumettreExerciceCode, SoumissionError } from "@/lib/soumissions";
import type { ResultatSoumissionCode } from "@/components/python/python-runner";

export async function soumettreExerciceCodeAction(
  exerciceId: string,
  slug: string,
  code: string,
  sortie: string,
  capture: string | null
): Promise<ResultatSoumissionCode> {
  const session = await auth();
  if (session?.user?.role !== "ELEVE") {
    return { reussi: null, message: "Accès réservé aux élèves.", erreur: true };
  }

  const exercice = await obtenirExerciceCode(exerciceId);
  if (!exercice) {
    return { reussi: null, message: "Exercice introuvable.", erreur: true };
  }

  const [cours, utilisateur] = await Promise.all([
    prisma.cours.findUnique({ where: { id: exercice.coursId } }),
    prisma.user.findUnique({ where: { id: session.user.id }, include: { classe: true } }),
  ]);

  const accesAutorise = cours?.publie && utilisateur?.classe?.niveau === cours.niveau;
  if (!accesAutorise) {
    return { reussi: null, message: "Accès refusé.", erreur: true };
  }

  try {
    const { reussiAuto } = await soumettreExerciceCode(exerciceId, session.user.id, {
      code,
      sortie,
      captureDataUrl: capture,
    });

    revalidatePath(`/eleve/cours/${slug}`);

    if (reussiAuto === null) {
      return {
        reussi: null,
        message: "Soumission enregistrée. Ton professeur corrigera ton travail manuellement.",
      };
    }

    return reussiAuto
      ? { reussi: true, message: "Bravo, ta sortie correspond à la sortie attendue !" }
      : {
          reussi: false,
          message: "Soumission enregistrée, mais ta sortie ne correspond pas (encore) à la sortie attendue.",
        };
  } catch (error) {
    if (error instanceof SoumissionError) {
      return { reussi: null, message: error.message, erreur: true };
    }
    throw error;
  }
}
