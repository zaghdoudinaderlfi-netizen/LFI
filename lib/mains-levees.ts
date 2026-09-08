import { prisma } from "./prisma";

export type MainLeveeActive = {
  id: string;
  eleveId: string;
  nom: string;
  prenom: string | null;
  classeNom: string | null;
  depuis: string; // ISO — date de levée (updatedAt de la ligne)
};

/** Lève la main de l'élève connecté (idempotent — pas d'effet si déjà levée). */
export async function leverLaMain(eleveId: string) {
  const eleve = await prisma.user.findUnique({
    where: { id: eleveId },
    select: { classeId: true },
  });

  return prisma.mainLevee.upsert({
    where: { eleveId },
    create: { eleveId, classeId: eleve?.classeId ?? null, actif: true },
    update: { actif: true, classeId: eleve?.classeId ?? null },
  });
}

/** Baisse la main de l'élève connecté (auto-annulation par l'élève lui-même). */
export async function baisserLaMain(eleveId: string) {
  await prisma.mainLevee.updateMany({ where: { eleveId }, data: { actif: false } });
}

/** Baisse la main d'un élève précis depuis la popup prof. */
export async function baisserLaMainParId(id: string) {
  await prisma.mainLevee.updateMany({ where: { id }, data: { actif: false } });
}

/** Baisse toutes les mains actives d'un coup (bouton "Tout baisser" prof). */
export async function baisserToutesLesMains() {
  await prisma.mainLevee.updateMany({ where: { actif: true }, data: { actif: false } });
}

/** État actuel (levée ou non) de la main de l'élève connecté. */
export async function mainEstLevee(eleveId: string): Promise<boolean> {
  const main = await prisma.mainLevee.findUnique({ where: { eleveId }, select: { actif: true } });
  return main?.actif ?? false;
}

/** Liste des mains actuellement levées, triée par ordre de levée (FIFO). */
export async function listerMainsLeveesActives(): Promise<MainLeveeActive[]> {
  const mains = await prisma.mainLevee.findMany({
    where: { actif: true },
    include: {
      eleve: { select: { nom: true, prenom: true } },
      classe: { select: { nom: true } },
    },
    orderBy: { updatedAt: "asc" },
  });

  return mains.map((m) => ({
    id: m.id,
    eleveId: m.eleveId,
    nom: m.eleve.nom,
    prenom: m.eleve.prenom,
    classeNom: m.classe?.nom ?? null,
    depuis: m.updatedAt.toISOString(),
  }));
}
