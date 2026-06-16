"use server";

import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { envoyerEmailReinit } from "@/lib/email";

// ── Demande de réinitialisation par email ─────────────────────────────────────

export async function demanderReinitAction(
  _prev: string | undefined,
  formData: FormData,
): Promise<string> {
  const email = formData.get("email");
  if (typeof email !== "string" || !email.trim()) return "Adresse email invalide.";

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, prenom: true },
  });

  // Réponse identique qu'il y ait un compte ou non (sécurité : pas d'énumération)
  const MSG_OK = "Si un compte existe pour cette adresse, tu vas recevoir un email avec un lien de réinitialisation. Pense à vérifier tes spams.";

  if (!user) return MSG_OK;

  // Invalider les anciens tokens non utilisés pour cet utilisateur
  await prisma.tokenReinitMdp.updateMany({
    where: { userId: user.id, utilise: false },
    data: { utilise: true },
  });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

  await prisma.tokenReinitMdp.create({
    data: { userId: user.id, token, expiresAt },
  });

  const base = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const lien = `${base}/mot-de-passe-oublie/reinitialiser/${token}`;

  try {
    await envoyerEmailReinit(email.trim().toLowerCase(), user.prenom ?? null, lien);
  } catch {
    // Ne pas révéler l'échec à l'utilisateur (anti-énumération)
    console.error("[reinit-mdp] Échec envoi email pour", email);
  }

  return MSG_OK;
}

// ── Validation du token (utilisé par la page, côté serveur) ──────────────────

export async function validerToken(token: string) {
  const record = await prisma.tokenReinitMdp.findUnique({
    where: { token },
    select: { expiresAt: true, utilise: true, userId: true },
  });
  if (!record) return { valide: false, raison: "Lien invalide ou déjà utilisé." };
  if (record.utilise) return { valide: false, raison: "Ce lien a déjà été utilisé." };
  if (record.expiresAt < new Date()) return { valide: false, raison: "Ce lien a expiré. Refais la demande." };
  return { valide: true, userId: record.userId };
}

// ── Réinitialisation effective du mot de passe ────────────────────────────────

export async function reinitialiserMdpAction(
  _prev: string | undefined,
  formData: FormData,
): Promise<string> {
  const token = formData.get("token");
  const nouveau = formData.get("nouveau");
  const confirmation = formData.get("confirmation");

  if (
    typeof token !== "string" ||
    typeof nouveau !== "string" ||
    typeof confirmation !== "string"
  ) return "Formulaire invalide.";

  if (nouveau.length < 8) return "Le mot de passe doit faire au moins 8 caractères.";
  if (nouveau !== confirmation) return "Les deux mots de passe ne correspondent pas.";

  const check = await validerToken(token);
  if (!check.valide) return check.raison!;

  const hash = await bcrypt.hash(nouveau, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: check.userId },
      data: { motDePasse: hash, doitChangerMdp: false },
    }),
    prisma.tokenReinitMdp.update({
      where: { token },
      data: { utilise: true },
    }),
  ]);

  return "ok";
}
