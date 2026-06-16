"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ── Vérification du rôle PROF ─────────────────────────────────────────────────

async function verifierProf() {
  const session = await auth();
  if (session?.user?.role !== "PROF") throw new Error("Accès refusé.");
  return session.user;
}

// ── Réinitialisation du mot de passe par l'admin ──────────────────────────────

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans I, O, 0, 1 (confusion visuelle)

function genererMdpTemporaire(): string {
  const groupe = () =>
    Array.from({ length: 4 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("");
  return `${groupe()}-${groupe()}-${groupe()}`;
}

/**
 * Réinitialise le mot de passe d'un élève et renvoie le mot de passe temporaire
 * EN CLAIR (affiché une seule fois à l'écran, jamais stocké en clair).
 */
export async function reinitMdpEleveAction(eleveId: string): Promise<{
  ok: boolean;
  mdpTemp?: string;
  erreur?: string;
}> {
  try {
    await verifierProf();
  } catch {
    return { ok: false, erreur: "Accès refusé." };
  }

  const eleve = await prisma.user.findUnique({
    where: { id: eleveId, role: "ELEVE" },
    select: { id: true },
  });
  if (!eleve) return { ok: false, erreur: "Élève introuvable." };

  const mdpTemp = genererMdpTemporaire();
  const hash = await bcrypt.hash(mdpTemp, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: eleveId },
      data: { motDePasse: hash, doitChangerMdp: true },
    }),
    // Invalider tous les tokens de réinitialisation existants
    prisma.tokenReinitMdp.updateMany({
      where: { userId: eleveId, utilise: false },
      data: { utilise: true },
    }),
  ]);

  revalidatePath("/prof/admin");
  return { ok: true, mdpTemp };
}

// ── Modification du profil d'un élève ─────────────────────────────────────────

export async function modifierEleveAction(
  _prev: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  try {
    await verifierProf();
  } catch {
    return "Accès refusé.";
  }

  const eleveId = formData.get("eleveId");
  const nom = formData.get("nom");
  const prenom = formData.get("prenom");
  const classeId = formData.get("classeId");
  const email = formData.get("email");

  if (
    typeof eleveId !== "string" ||
    typeof nom !== "string" ||
    typeof prenom !== "string" ||
    typeof classeId !== "string" ||
    typeof email !== "string"
  ) return "Formulaire invalide.";

  if (!nom.trim()) return "Le nom est obligatoire.";

  const eleve = await prisma.user.findUnique({
    where: { id: eleveId, role: "ELEVE" },
    select: { id: true },
  });
  if (!eleve) return "Élève introuvable.";

  const emailNettoye = email.trim().toLowerCase();
  if (emailNettoye && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNettoye)) {
    return "Adresse email invalide.";
  }

  if (emailNettoye) {
    const doublonEmail = await prisma.user.findFirst({
      where: { email: emailNettoye, NOT: { id: eleveId } },
    });
    if (doublonEmail) return "Cette adresse email est déjà utilisée.";
  }

  const nouvelleClasseId = classeId.trim() || null;
  if (nouvelleClasseId) {
    const classe = await prisma.classe.findUnique({ where: { id: nouvelleClasseId } });
    if (!classe) return "Classe introuvable.";
  }

  await prisma.user.update({
    where: { id: eleveId },
    data: {
      nom: nom.trim(),
      prenom: prenom.trim() || null,
      classeId: nouvelleClasseId,
      ...(emailNettoye ? { email: emailNettoye } : {}),
    },
  });

  revalidatePath("/prof/admin");
  return "ok";
}
