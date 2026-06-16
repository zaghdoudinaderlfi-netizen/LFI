"use server";

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
