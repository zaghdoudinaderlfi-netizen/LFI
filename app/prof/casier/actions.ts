"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { estMatiereValide } from "@/lib/classes-constants";
import {
  CasierError,
  partagerDocumentMatiere,
  obtenirDocument,
  supprimerDocument,
  creerDossierProf,
  renommerDossier,
  supprimerDossier,
  obtenirDossier,
  deplacerDocument,
} from "@/lib/casier";

export async function partagerDocumentAction(
  _prev: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role !== "PROF") return "Accès refusé.";

  const matiere = formData.get("matiere");
  const fichier = formData.get("fichier");
  const dossierId = formData.get("dossierId");

  if (typeof matiere !== "string" || !estMatiereValide(matiere)) return "Matière invalide.";
  if (!(fichier instanceof File) || fichier.size === 0) return "Sélectionne un fichier.";

  try {
    await partagerDocumentMatiere(session.user.id, matiere, fichier, typeof dossierId === "string" ? dossierId : null);
  } catch (error) {
    if (error instanceof CasierError) return error.message;
    throw error;
  }

  revalidatePath("/prof/casier");
}

export async function supprimerDocumentProfAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (session?.user?.role !== "PROF") return;

  const id = formData.get("id");
  if (typeof id !== "string") return;

  await supprimerDocument(id);
  revalidatePath("/prof/casier");
}

export async function supprimerDocumentPartageAction(id: string): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role !== "PROF") return "Accès refusé.";

  const doc = await obtenirDocument(id);
  // Seuls les documents partagés (eleveId null) sont gérés depuis cette
  // vue — jamais le fichier personnel d'un élève, même par id deviné.
  if (!doc || doc.eleveId !== null) return "Document introuvable.";

  await supprimerDocument(id);
  revalidatePath("/prof/casier");
}

export async function creerDossierProfAction(matiere: string, nom: string): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role !== "PROF") return "Accès refusé.";
  if (!estMatiereValide(matiere)) return "Matière invalide.";

  try {
    await creerDossierProf(session.user.id, matiere, nom);
  } catch (error) {
    if (error instanceof CasierError) return error.message;
    throw error;
  }

  revalidatePath("/prof/casier");
}

export async function renommerDossierProfAction(id: string, nom: string): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role !== "PROF") return "Accès refusé.";

  const dossier = await obtenirDossier(id);
  if (!dossier || dossier.eleveId !== null) return "Dossier introuvable.";

  try {
    await renommerDossier(id, nom);
  } catch (error) {
    if (error instanceof CasierError) return error.message;
    throw error;
  }

  revalidatePath("/prof/casier");
}

export async function supprimerDossierProfAction(id: string): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role !== "PROF") return "Accès refusé.";

  const dossier = await obtenirDossier(id);
  if (!dossier || dossier.eleveId !== null) return "Dossier introuvable.";

  await supprimerDossier(id);
  revalidatePath("/prof/casier");
}

export async function deplacerDocumentProfAction(
  id: string,
  dossierId: string | null
): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role !== "PROF") return "Accès refusé.";

  const doc = await obtenirDocument(id);
  if (!doc || doc.eleveId !== null) return "Document introuvable.";

  if (dossierId) {
    const dossier = await obtenirDossier(dossierId);
    if (!dossier || dossier.eleveId !== null) return "Dossier introuvable.";
  }

  await deplacerDocument(id, dossierId);
  revalidatePath("/prof/casier");
}
