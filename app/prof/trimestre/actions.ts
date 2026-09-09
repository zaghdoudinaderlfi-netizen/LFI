"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  TrimestreError,
  cloturerTrimestreActuel,
  ouvrirNouveauTrimestre,
} from "@/lib/trimestre";

async function verifierProf() {
  const session = await auth();
  if (session?.user?.role !== "PROF") throw new Error("Accès refusé.");
}

function revaliderPagesConcernees() {
  revalidatePath("/prof/trimestre");
  revalidatePath("/prof");
  revalidatePath("/eleve/notes");
  revalidatePath("/eleve");
}

export async function cloturerTrimestreAction(): Promise<{ ok: boolean; erreur?: string }> {
  try {
    await verifierProf();
  } catch {
    return { ok: false, erreur: "Accès refusé." };
  }

  try {
    await cloturerTrimestreActuel();
  } catch (error) {
    if (error instanceof TrimestreError) return { ok: false, erreur: error.message };
    throw error;
  }

  revaliderPagesConcernees();
  return { ok: true };
}

export async function ouvrirTrimestreAction(nom: string): Promise<{ ok: boolean; erreur?: string }> {
  try {
    await verifierProf();
  } catch {
    return { ok: false, erreur: "Accès refusé." };
  }

  try {
    await ouvrirNouveauTrimestre(nom);
  } catch (error) {
    if (error instanceof TrimestreError) return { ok: false, erreur: error.message };
    throw error;
  }

  revaliderPagesConcernees();
  return { ok: true };
}
