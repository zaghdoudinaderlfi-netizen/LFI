"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  CasierError,
  deposerFichierEleve,
  obtenirDocument,
  supprimerDocument,
  creerDossierEleve,
  renommerDossier,
  supprimerDossier,
  obtenirDossier,
  deplacerDocument,
} from "@/lib/casier";

export async function deposerFichierAction(
  _prev: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role !== "ELEVE") return "Accès refusé.";

  const fichier = formData.get("fichier");
  if (!(fichier instanceof File) || fichier.size === 0) return "Sélectionne un fichier.";

  const dossierId = formData.get("dossierId");

  try {
    await deposerFichierEleve(session.user.id, fichier, typeof dossierId === "string" ? dossierId : null);
  } catch (error) {
    if (error instanceof CasierError) return error.message;
    throw error;
  }

  revalidatePath("/eleve/casier");
}

export async function supprimerFichierEleveAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (session?.user?.role !== "ELEVE") return;

  const id = formData.get("id");
  if (typeof id !== "string") return;

  // Un élève ne peut supprimer que ses propres fichiers — jamais un document
  // partagé par le prof (eleveId null) ni le fichier d'un autre élève.
  const doc = await obtenirDocument(id);
  if (!doc || doc.eleveId !== session.user.id) return;

  await supprimerDocument(id);
  revalidatePath("/eleve/casier");
}

export async function supprimerDocumentEleveAction(id: string): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role !== "ELEVE") return "Accès refusé.";

  const doc = await obtenirDocument(id);
  if (!doc || doc.eleveId !== session.user.id) return "Fichier introuvable.";

  await supprimerDocument(id);
  revalidatePath("/eleve/casier");
}

export async function creerDossierEleveAction(nom: string): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role !== "ELEVE") return "Accès refusé.";

  try {
    await creerDossierEleve(session.user.id, nom);
  } catch (error) {
    if (error instanceof CasierError) return error.message;
    throw error;
  }

  revalidatePath("/eleve/casier");
}

export async function renommerDossierEleveAction(id: string, nom: string): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role !== "ELEVE") return "Accès refusé.";

  const dossier = await obtenirDossier(id);
  if (!dossier || dossier.eleveId !== session.user.id) return "Dossier introuvable.";

  try {
    await renommerDossier(id, nom);
  } catch (error) {
    if (error instanceof CasierError) return error.message;
    throw error;
  }

  revalidatePath("/eleve/casier");
}

export async function supprimerDossierEleveAction(id: string): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role !== "ELEVE") return "Accès refusé.";

  const dossier = await obtenirDossier(id);
  if (!dossier || dossier.eleveId !== session.user.id) return "Dossier introuvable.";

  await supprimerDossier(id);
  revalidatePath("/eleve/casier");
}

export async function deplacerDocumentEleveAction(
  id: string,
  dossierId: string | null
): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role !== "ELEVE") return "Accès refusé.";

  const doc = await obtenirDocument(id);
  if (!doc || doc.eleveId !== session.user.id) return "Fichier introuvable.";

  if (dossierId) {
    const dossier = await obtenirDossier(dossierId);
    if (!dossier || dossier.eleveId !== session.user.id) return "Dossier introuvable.";
  }

  await deplacerDocument(id, dossierId);
  revalidatePath("/eleve/casier");
}
