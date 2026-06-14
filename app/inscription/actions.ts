"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { inscrireEleve, InscriptionError } from "@/lib/inscription";

export async function inscrire(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const nom = formData.get("nom");
  const prenom = formData.get("prenom");
  const email = formData.get("email");
  const motDePasse = formData.get("motDePasse");
  const codeInscription = formData.get("codeInscription");

  if (
    typeof nom !== "string" ||
    typeof prenom !== "string" ||
    typeof email !== "string" ||
    typeof motDePasse !== "string" ||
    typeof codeInscription !== "string"
  ) {
    return "Formulaire invalide.";
  }

  try {
    await inscrireEleve({ nom, prenom, email, motDePasse, codeInscription });
  } catch (error) {
    if (error instanceof InscriptionError) {
      return error.message;
    }
    throw error;
  }

  try {
    await signIn("credentials", {
      email,
      password: motDePasse,
      redirectTo: "/eleve",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Compte créé. Vous pouvez maintenant vous connecter.";
    }
    throw error;
  }
}
