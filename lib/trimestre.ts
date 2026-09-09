import { prisma } from "./prisma";
import { trimestreActuel } from "./suivi-oral-constants";

export class TrimestreError extends Error {}

/** Le cycle de trimestre le plus récent (le trimestre "actif"), ou null si
 * aucun n'a jamais été ouvert par le prof. */
export async function obtenirCycleActif() {
  return prisma.cycleTrimestre.findFirst({ orderBy: { createdAt: "desc" } });
}

/** Historique des cycles précédents (le plus récent, actif ou non, exclu). */
export async function listerCyclesPrecedents() {
  const [actif, ...reste] = await prisma.cycleTrimestre.findMany({
    orderBy: { createdAt: "desc" },
  });
  return actif ? reste : [];
}

/**
 * Vrai seulement si un cycle a été ouvert ET clôturé par le prof — c'est ce
 * qui conditionne l'affichage de la note finale /20 côté élève (voir
 * app/eleve/notes/page.tsx). Tant qu'aucun cycle n'existe, on considère le
 * trimestre non clôturé (état le plus prudent : rien n'est montré).
 */
export async function trimestreEstCloture(): Promise<boolean> {
  const cycle = await obtenirCycleActif();
  return cycle?.cloture ?? false;
}

/** Nom suggéré pour un nouveau cycle, ex. "Trimestre 2 2025-2026". */
export function suggererNomCycle(): string {
  const maintenant = new Date();
  const numero: Record<ReturnType<typeof trimestreActuel>, number> = { T1: 1, T2: 2, T3: 3 };
  // L'année scolaire commence en septembre : avant septembre, on est encore
  // sur l'année scolaire entamée l'année civile précédente.
  const anneeDebut = maintenant.getMonth() >= 8 ? maintenant.getFullYear() : maintenant.getFullYear() - 1;
  return `Trimestre ${numero[trimestreActuel()]} ${anneeDebut}-${anneeDebut + 1}`;
}

/** Clôture le cycle actif : la note finale /20 devient visible aux élèves. */
export async function cloturerTrimestreActuel() {
  const cycle = await obtenirCycleActif();
  if (!cycle) {
    throw new TrimestreError("Aucun trimestre n'est ouvert pour le moment.");
  }
  if (cycle.cloture) {
    throw new TrimestreError("Ce trimestre est déjà clôturé.");
  }
  return prisma.cycleTrimestre.update({
    where: { id: cycle.id },
    data: { cloture: true, dateCloture: new Date() },
  });
}

/**
 * Ouvre un nouveau cycle pour recommencer : la note finale /20 redevient
 * masquée aux élèves jusqu'à la prochaine clôture. L'historique du cycle
 * précédent n'est jamais supprimé. Refuse d'ouvrir un nouveau cycle tant que
 * le précédent n'est pas clôturé, pour ne pas avoir deux cycles "actifs" en
 * même temps.
 */
export async function ouvrirNouveauTrimestre(nom: string) {
  const nomNettoye = nom.trim();
  if (!nomNettoye) {
    throw new TrimestreError("Le nom du trimestre est requis.");
  }

  const cycleActif = await obtenirCycleActif();
  if (cycleActif && !cycleActif.cloture) {
    throw new TrimestreError("Le trimestre en cours doit d'abord être clôturé.");
  }

  return prisma.cycleTrimestre.create({ data: { nom: nomNettoye } });
}
