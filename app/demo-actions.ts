"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

// Note : "quitter la démo" n'est PAS une Server Action (voir
// app/api/demo/quitter/route.ts) — le blocage anti-écriture du middleware
// (voir auth.config.ts) refuse toute Server Action pour un compte isDemo,
// déconnexion comprise. Une route API classique contourne ce blocage
// puisqu'elle ne mute aucune donnée applicative.

export async function demarrerDemoAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const role = formData.get("role");

  try {
    await signIn("demo", {
      role,
      redirectTo: role === "PROF" ? "/prof" : "/eleve",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "La démo n'est pas disponible pour le moment.";
    }
    throw error;
  }
}
