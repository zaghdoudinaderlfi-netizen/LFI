"use server";

import { revalidatePath } from "next/cache";
import { TypeExercice } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { creerExerciceCode, supprimerExerciceCode, ExerciceCodeError } from "@/lib/exercices-code";
import { debloquerEleve } from "@/lib/examen";

async function revaliderCours(coursId: string) {
  revalidatePath(`/prof/cours/${coursId}`);
  revalidatePath(`/prof/cours/${coursId}/apercu`);

  const cours = await prisma.cours.findUnique({ where: { id: coursId }, select: { slug: true } });
  if (cours) {
    revalidatePath(`/eleve/cours/${cours.slug}`);
  }
}

export async function creerExerciceCodeAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role !== "PROF") {
    return "Accès réservé aux professeurs.";
  }

  const coursId = formData.get("coursId");
  const titre = formData.get("titre");
  const consigne = formData.get("consigne");
  const type = formData.get("type");
  const codeDepart = formData.get("codeDepart");
  const sortieAttendue = formData.get("sortieAttendue");
  const points = formData.get("points");
  const dateLimite = formData.get("dateLimite");
  const modeExamen = formData.get("modeExamen") === "on";
  const examenDebut = formData.get("examenDebut");
  const examenFin = formData.get("examenFin");

  if (
    typeof coursId !== "string" ||
    typeof titre !== "string" ||
    typeof consigne !== "string" ||
    typeof type !== "string" ||
    typeof points !== "string"
  ) {
    return "Formulaire invalide.";
  }

  if (type !== TypeExercice.PYTHON && type !== TypeExercice.TURTLE) {
    return "Type d'exercice invalide.";
  }

  try {
    await creerExerciceCode(coursId, {
      titre,
      consigne,
      type,
      codeDepart: typeof codeDepart === "string" ? codeDepart : undefined,
      sortieAttendue: typeof sortieAttendue === "string" ? sortieAttendue : undefined,
      points: Number(points),
      dateLimite: typeof dateLimite === "string" && dateLimite ? new Date(dateLimite) : null,
      modeExamen,
      examenDebut: typeof examenDebut === "string" && examenDebut ? new Date(examenDebut) : null,
      examenFin: typeof examenFin === "string" && examenFin ? new Date(examenFin) : null,
    });
  } catch (error) {
    if (error instanceof ExerciceCodeError) return error.message;
    throw error;
  }

  await revaliderCours(coursId);
  return "Exercice ajouté.";
}

export async function supprimerExerciceCodeAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (session?.user?.role !== "PROF") return;

  const id = formData.get("id");
  const coursId = formData.get("coursId");
  if (typeof id !== "string" || typeof coursId !== "string") return;

  await supprimerExerciceCode(id);

  await revaliderCours(coursId);
}

export async function debloquerEleveAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (session?.user?.role !== "PROF") return;

  const exerciceId = formData.get("exerciceId");
  const eleveId = formData.get("eleveId");
  const coursId = formData.get("coursId");
  if (typeof exerciceId !== "string" || typeof eleveId !== "string" || typeof coursId !== "string") return;

  await debloquerEleve(exerciceId, eleveId, session.user.id);

  await revaliderCours(coursId);
}
