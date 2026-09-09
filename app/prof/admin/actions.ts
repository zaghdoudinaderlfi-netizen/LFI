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

// ── Déplacement d'un élève entre classes (glisser-déposer) ────────────────────

export async function deplacerEleveAction(
  eleveId: string,
  nouvelleClasseId: string | null,
): Promise<{ ok: boolean; erreur?: string; classeNom?: string }> {
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

  let classeNom: string | undefined;
  if (nouvelleClasseId) {
    const classe = await prisma.classe.findUnique({
      where: { id: nouvelleClasseId },
      select: { nom: true },
    });
    if (!classe) return { ok: false, erreur: "Classe introuvable." };
    classeNom = classe.nom;
  }

  await prisma.user.update({
    where: { id: eleveId },
    data: { classeId: nouvelleClasseId },
  });

  revalidatePath("/prof/admin");
  return { ok: true, classeNom };
}

// ── Suppression d'un élève ─────────────────────────────────────────────────────

export async function supprimerEleveAction(eleveId: string): Promise<{
  ok: boolean;
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

  // Tout le reste (soumissions, tentatives de quiz, comptes-rendus,
  // notifications, suivi oral...) est en ON DELETE CASCADE sur User.id.
  await prisma.user.delete({ where: { id: eleveId } });

  revalidatePath("/prof/admin");
  revalidatePath("/prof/classes");
  return { ok: true };
}

// ── Suppression d'une classe (et de ses élèves) ────────────────────────────────

export async function supprimerClasseAction(classeId: string): Promise<{
  ok: boolean;
  erreur?: string;
}> {
  try {
    await verifierProf();
  } catch {
    return { ok: false, erreur: "Accès refusé." };
  }

  const classe = await prisma.classe.findUnique({
    where: { id: classeId },
    select: { id: true },
  });
  if (!classe) return { ok: false, erreur: "Classe introuvable." };

  // La contrainte User.classeId est ON DELETE SET NULL : supprimer la classe
  // seule ne ferait que détacher les élèves. On les supprime explicitement
  // d'abord (demande produit : "supprimer la classe supprime ses élèves"),
  // puis la classe — dans une transaction pour rester cohérent en cas d'échec.
  await prisma.$transaction([
    prisma.user.deleteMany({ where: { classeId, role: "ELEVE" } }),
    prisma.classe.delete({ where: { id: classeId } }),
  ]);

  revalidatePath("/prof/admin");
  revalidatePath("/prof/classes");
  return { ok: true };
}
