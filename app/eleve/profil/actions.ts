"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function modifierProfilAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user) {
    return "Non connecté.";
  }

  const nom = formData.get("nom");
  const prenom = formData.get("prenom");

  if (typeof nom !== "string" || typeof prenom !== "string") {
    return "Formulaire invalide.";
  }

  if (!nom.trim()) {
    return "Le nom est obligatoire.";
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { nom: nom.trim(), prenom: prenom.trim() || null },
  });

  revalidatePath("/eleve/profil");
  return "Profil mis à jour.";
}
