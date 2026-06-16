"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AUCUN, AVATAR_CATEGORIES, estStyleAvatar, type AvatarOptions } from "@/lib/avatar";

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

export async function changerMdpAction(
  _prev: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user) return "Non connecté.";

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
    data: { motDePasse: hash, doitChangerMdp: false },
  });

  return "ok";
}

export async function modifierEmailAction(
  _prev: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user) return "Non connecté.";

  const email = formData.get("email");
  if (typeof email !== "string") return "Formulaire invalide.";

  const emailNettoye = email.trim().toLowerCase();
  if (emailNettoye && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNettoye)) {
    return "Adresse email invalide.";
  }

  if (emailNettoye) {
    const existant = await prisma.user.findFirst({
      where: { email: emailNettoye, NOT: { id: session.user.id } },
    });
    if (existant) return "Cette adresse email est déjà utilisée par un autre compte.";
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { email: emailNettoye || session.user.email! },
  });

  revalidatePath("/eleve/profil");
  return "ok";
}

/** Sauvegarde la config d'avatar (constructeur). Renvoie "ok" ou un message d'erreur. */
export async function enregistrerAvatarAction(
  style: string,
  options: Record<string, string>
): Promise<string> {
  const session = await auth();
  if (!session?.user) {
    return "Non connecté.";
  }

  if (!estStyleAvatar(style)) {
    return "Style d'avatar invalide.";
  }

  // On ne garde que les options connues, avec une valeur autorisée pour
  // chaque partie (anti-falsification du formulaire).
  const optionsValidees: AvatarOptions = {};
  for (const categorie of AVATAR_CATEGORIES[style]) {
    for (const control of categorie.controls) {
      const valeur = options[control.optionKey];
      const valide = control.choices.some((c) => c.value === valeur);
      optionsValidees[control.optionKey] = valide
        ? valeur
        : control.probabilityKey
          ? AUCUN
          : control.choices.find((c) => c.value !== AUCUN)?.value ?? control.choices[0].value;
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarStyle: style, avatarOptions: optionsValidees },
  });

  revalidatePath("/eleve", "layout");
  return "ok";
}
