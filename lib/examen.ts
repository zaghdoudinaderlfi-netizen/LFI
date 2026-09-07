import { prisma } from "./prisma";

// Verrouillage "dur" d'un élève sur un exercice en mode examen (voir
// VerrouExamen dans le schéma) : une fois verrouillé, seul un prof peut
// débloquer l'élève (debloquerEleve) — jamais automatique côté client.

export async function obtenirVerrouActif(exerciceId: string, eleveId: string) {
  const verrou = await prisma.verrouExamen.findUnique({
    where: { exerciceId_eleveId: { exerciceId, eleveId } },
  });
  return verrou && verrou.debloqueAt === null ? verrou : null;
}

export async function verrouillerEleve(exerciceId: string, eleveId: string, motif: string) {
  await prisma.verrouExamen.upsert({
    where: { exerciceId_eleveId: { exerciceId, eleveId } },
    create: { exerciceId, eleveId, motif },
    update: { verrouilleAt: new Date(), motif, debloqueAt: null, debloqueParId: null },
  });
}

export async function debloquerEleve(exerciceId: string, eleveId: string, profId: string) {
  await prisma.verrouExamen.update({
    where: { exerciceId_eleveId: { exerciceId, eleveId } },
    data: { debloqueAt: new Date(), debloqueParId: profId },
  });
}

export async function listerVerrousActifs(exerciceId: string) {
  return prisma.verrouExamen.findMany({
    where: { exerciceId, debloqueAt: null },
    include: { eleve: { select: { id: true, nom: true, prenom: true } } },
    orderBy: { verrouilleAt: "desc" },
  });
}
