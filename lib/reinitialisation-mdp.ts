import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { parserDateNaissance, formaterNomComplet } from "./utilisateurs";
import { notifierEleve, notifierProfs } from "./notifications";

export class ReinitMdpError extends Error {}

// Assez court pour qu'un jeton non utilisé ne traîne pas, assez long pour
// laisser le temps de finir le formulaire (étape 1 → étape 2 sur la même
// page, pas d'email à ouvrir).
const DUREE_TOKEN_MS = 15 * 60 * 1000;

const ERREUR_IDENTITE =
  "Email ou date de naissance incorrects, ou date de naissance non renseignée sur ton compte.";

function memeJour(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/**
 * Vérifie l'identité d'un élève par email + date de naissance — voir le
 * commentaire sur User.dateNaissance (schema.prisma) : ce n'est pas un
 * secret fort, mais suffisant pour un usage scolaire interne. La protection
 * contre le brute-force de la date de naissance se fait en amont, côté
 * appelant (voir app/mot-de-passe-oublie/actions.ts, limiterFrequence).
 *
 * Si elle correspond, crée un jeton à usage unique (15 min) et invalide tout
 * jeton précédent encore actif pour cet élève. Message d'erreur identique
 * que l'email existe ou non, pour ne pas révéler quels comptes existent.
 */
export async function demanderReinitMdp({
  email,
  dateNaissance,
}: {
  email: string;
  dateNaissance: string;
}): Promise<{ token: string }> {
  const resultatDate = parserDateNaissance(dateNaissance);
  if ("erreur" in resultatDate) {
    throw new ReinitMdpError(resultatDate.erreur);
  }

  const emailNettoye = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: emailNettoye },
    select: { id: true, role: true, dateNaissance: true },
  });

  if (
    !user ||
    user.role !== "ELEVE" ||
    !user.dateNaissance ||
    !memeJour(user.dateNaissance, resultatDate.date)
  ) {
    throw new ReinitMdpError(ERREUR_IDENTITE);
  }

  const token = randomBytes(32).toString("hex");

  await prisma.$transaction([
    prisma.tokenReinitMdp.updateMany({
      where: { userId: user.id, utilise: false },
      data: { utilise: true },
    }),
    prisma.tokenReinitMdp.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + DUREE_TOKEN_MS),
      },
    }),
  ]);

  return { token };
}

/**
 * Consomme un jeton de réinitialisation valide pour fixer un nouveau mot de
 * passe. Notifie l'élève (au cas où ce ne serait pas lui) et les profs (pour
 * qu'ils gardent une visibilité sur les réinitialisations faites sans eux).
 */
export async function reinitialiserAvecToken({
  token,
  nouveauMdp,
}: {
  token: string;
  nouveauMdp: string;
}): Promise<void> {
  const tokenTrouve = await prisma.tokenReinitMdp.findUnique({
    where: { token },
    include: { user: { select: { id: true, nom: true, prenom: true } } },
  });

  if (!tokenTrouve || tokenTrouve.utilise || tokenTrouve.expiresAt < new Date()) {
    throw new ReinitMdpError(
      "Cette session de réinitialisation a expiré ou a déjà été utilisée. Relance une demande."
    );
  }

  if (nouveauMdp.length < 8) {
    throw new ReinitMdpError("Le nouveau mot de passe doit faire au moins 8 caractères.");
  }

  const hash = await bcrypt.hash(nouveauMdp, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: tokenTrouve.userId },
      data: { motDePasse: hash, doitChangerMdp: false },
    }),
    prisma.tokenReinitMdp.update({
      where: { id: tokenTrouve.id },
      data: { utilise: true },
    }),
  ]);

  await Promise.all([
    notifierEleve(
      tokenTrouve.userId,
      "Ton mot de passe a été réinitialisé. Si ce n'était pas toi, préviens ton professeur.",
      undefined,
      undefined,
      "GENERALE"
    ),
    notifierProfs(
      `${formaterNomComplet(tokenTrouve.user)} a réinitialisé son mot de passe lui-même (libre-service).`,
      undefined,
      undefined,
      "GENERALE"
    ),
  ]);
}
