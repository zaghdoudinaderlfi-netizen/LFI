"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { noterCompteRendu, supprimerCompteRendu, CompteRenduError } from "@/lib/comptes-rendus";

/** Note en étoiles (0-5) donnée par le prof à un dépôt — appelée directement au clic. */
export async function noterCompteRenduAction(id: string, noteEtoiles: number) {
  const session = await auth();
  if (session?.user?.role !== "PROF") return;

  try {
    await noterCompteRendu(id, noteEtoiles);
  } catch (error) {
    if (error instanceof CompteRenduError) return;
    throw error;
  }

  revalidatePath(`/prof/comptes-rendus/${id}`);
  revalidatePath("/prof/comptes-rendus");
}

/**
 * Supprime un dépôt — appelée depuis la liste et depuis la page de détail.
 * On redirige vers la liste : depuis la page de détail, elle vient de
 * disparaître ; depuis la liste, la redirection la rafraîchit simplement.
 */
export async function supprimerCompteRenduAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (session?.user?.role !== "PROF") return;

  const id = formData.get("id");
  if (typeof id !== "string") return;

  try {
    await supprimerCompteRendu(id);
  } catch (error) {
    if (error instanceof CompteRenduError) return;
    throw error;
  }

  revalidatePath("/prof/comptes-rendus");
  redirect("/prof/comptes-rendus");
}
