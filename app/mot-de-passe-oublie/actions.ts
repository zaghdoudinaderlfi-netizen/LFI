"use server";

import {
  demanderReinitMdp,
  reinitialiserAvecToken,
  ReinitMdpError,
} from "@/lib/reinitialisation-mdp";
import { adresseIpAppelant, limiterFrequence } from "@/lib/limite-acces";

// La date de naissance n'est pas un secret fort (voir lib/reinitialisation-mdp.ts) :
// ce verrou est donc plus strict que celui de la connexion (auth.ts) pour
// compenser un espace de valeurs plus petit et plus devinable.
const MAX_TENTATIVES_EMAIL = 5;
const MAX_TENTATIVES_IP = 20;
const FENETRE_MS = 30 * 60 * 1000;

export type EtapeDemande =
  | { etape: "erreur"; message: string }
  | { etape: "token"; token: string };

export async function demanderReinitMdpAction(
  _prev: EtapeDemande | undefined,
  formData: FormData
): Promise<EtapeDemande> {
  const email = formData.get("email");
  const dateNaissance = formData.get("dateNaissance");

  if (typeof email !== "string" || typeof dateNaissance !== "string") {
    return { etape: "erreur", message: "Champs invalides." };
  }

  const emailNettoye = email.trim().toLowerCase();
  const ip = await adresseIpAppelant();

  const [okEmail, okIp] = await Promise.all([
    limiterFrequence(`reinit-mdp:email:${emailNettoye}`, MAX_TENTATIVES_EMAIL, FENETRE_MS),
    limiterFrequence(`reinit-mdp:ip:${ip}`, MAX_TENTATIVES_IP, FENETRE_MS),
  ]);
  if (!okEmail || !okIp) {
    return {
      etape: "erreur",
      message: "Trop de tentatives. Réessaie dans 30 minutes, ou demande à ton professeur.",
    };
  }

  try {
    const { token } = await demanderReinitMdp({ email: emailNettoye, dateNaissance });
    return { etape: "token", token };
  } catch (error) {
    if (error instanceof ReinitMdpError) return { etape: "erreur", message: error.message };
    return { etape: "erreur", message: "Erreur serveur." };
  }
}

export type EtapeFinale = { ok: boolean; message: string };

export async function reinitialiserMdpAction(
  _prev: EtapeFinale | undefined,
  formData: FormData
): Promise<EtapeFinale> {
  const token = formData.get("token");
  const nouveau = formData.get("nouveau");
  const confirmation = formData.get("confirmation");

  if (
    typeof token !== "string" ||
    typeof nouveau !== "string" ||
    typeof confirmation !== "string"
  ) {
    return { ok: false, message: "Formulaire invalide." };
  }
  if (nouveau !== confirmation) {
    return { ok: false, message: "Les deux mots de passe ne correspondent pas." };
  }

  try {
    await reinitialiserAvecToken({ token, nouveauMdp: nouveau });
    return { ok: true, message: "Mot de passe changé — tu peux te connecter." };
  } catch (error) {
    if (error instanceof ReinitMdpError) return { ok: false, message: error.message };
    return { ok: false, message: "Erreur serveur." };
  }
}
