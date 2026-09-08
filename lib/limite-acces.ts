import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * IP de l'appelant vue par Vercel/le proxy en amont. `x-forwarded-for` peut
 * contenir plusieurs adresses (client, proxys) séparées par des virgules —
 * la première est celle du client.
 */
export async function adresseIpAppelant(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return h.get("x-real-ip") ?? "inconnue";
}

/**
 * Incrémente un compteur à fenêtre glissante identifié par `cle` et indique
 * s'il dépasse `max` sur la fenêtre `fenetreMs`. Stocké en base (et non en
 * mémoire) car les fonctions serverless ne partagent pas d'état entre
 * invocations.
 */
export async function limiterFrequence(
  cle: string,
  max: number,
  fenetreMs: number
): Promise<boolean> {
  const maintenant = new Date();

  const existant = await prisma.limiteAcces.findUnique({ where: { cle } });

  if (!existant || existant.expireA < maintenant) {
    await prisma.limiteAcces.upsert({
      where: { cle },
      create: { cle, compteur: 1, expireA: new Date(maintenant.getTime() + fenetreMs) },
      update: { compteur: 1, expireA: new Date(maintenant.getTime() + fenetreMs) },
    });
    return true;
  }

  const maj = await prisma.limiteAcces.update({
    where: { cle },
    data: { compteur: { increment: 1 } },
  });

  return maj.compteur <= max;
}

/** Compteur d'échecs (ex: connexion) sur la fenêtre en cours, sans l'incrémenter. */
export async function compteurActuel(cle: string): Promise<number> {
  const existant = await prisma.limiteAcces.findUnique({ where: { cle } });
  if (!existant || existant.expireA < new Date()) return 0;
  return existant.compteur;
}

/** Enregistre un échec : incrémente le compteur, prolonge la fenêtre s'il vient d'expirer. */
export async function enregistrerEchec(cle: string, fenetreMs: number): Promise<void> {
  const maintenant = new Date();
  const existant = await prisma.limiteAcces.findUnique({ where: { cle } });

  if (!existant || existant.expireA < maintenant) {
    await prisma.limiteAcces.upsert({
      where: { cle },
      create: { cle, compteur: 1, expireA: new Date(maintenant.getTime() + fenetreMs) },
      update: { compteur: 1, expireA: new Date(maintenant.getTime() + fenetreMs) },
    });
    return;
  }

  await prisma.limiteAcces.update({ where: { cle }, data: { compteur: { increment: 1 } } });
}

/** Efface le compteur (ex: après une connexion réussie). */
export async function reinitialiserCompteur(cle: string): Promise<void> {
  await prisma.limiteAcces.deleteMany({ where: { cle } });
}
