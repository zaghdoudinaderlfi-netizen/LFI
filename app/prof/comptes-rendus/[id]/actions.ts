"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { noterCompteRendu, CompteRenduError } from "@/lib/comptes-rendus";

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
