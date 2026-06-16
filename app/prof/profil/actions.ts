"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function modifierProfilProfAction(
  _prev: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user || session.user.role !== "PROF") return "Accès refusé.";

  const nom = formData.get("nom");
  const prenom = formData.get("prenom");

  if (typeof nom !== "string" || typeof prenom !== "string") return "Formulaire invalide.";
  if (!nom.trim()) return "Le nom est obligatoire.";

  await prisma.user.update({
    where: { id: session.user.id },
    data: { nom: nom.trim(), prenom: prenom.trim() || null },
  });

  revalidatePath("/prof/profil");
  return "Profil mis à jour.";
}

export async function changerMdpProfAction(
  _prev: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user || session.user.role !== "PROF") return "Accès refusé.";

  const ancien = formData.get("ancien");
  const nouveau = formData.get("nouveau");
  const confirmation = formData.get("confirmation");

  if (
    typeof ancien !== "string" ||
    typeof nouveau !== "string" ||
    typeof confirmation !== "string"
  ) return "Formulaire invalide.";

  if (nouveau.length < 8) return "Le nouveau mot de passe doit faire au moins 8 caractères.";
  if (nouveau !== confirmation) return "Les deux mots de passe ne correspondent pas.";

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { motDePasse: true },
  });
  if (!user) return "Utilisateur introuvable.";

  const valide = await bcrypt.compare(ancien, user.motDePasse);
  if (!valide) return "Le mot de passe actuel est incorrect.";

  const hash = await bcrypt.hash(nouveau, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { motDePasse: hash },
  });

  return "ok";
}
