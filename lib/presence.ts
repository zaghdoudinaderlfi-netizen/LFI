import { prisma } from "./prisma";

// Seuil au-delà duquel un élève sans battement de coeur récent
// (components/eleve/presence-heartbeat.tsx, toutes les 20s) est considéré
// déconnecté. Marge x2 pour tolérer un battement raté.
export const SEUIL_EN_LIGNE_MS = 45_000;

export type EleveAvecPresence = {
  id: string;
  nom: string;
  prenom: string | null;
  enLigne: boolean;
};

export type ClasseAvecPresence = {
  id: string;
  nom: string;
  eleves: EleveAvecPresence[];
};

export async function listerElevesAvecPresence(): Promise<ClasseAvecPresence[]> {
  const classes = await prisma.classe.findMany({
    select: {
      id: true,
      nom: true,
      eleves: {
        where: { role: "ELEVE" },
        select: { id: true, nom: true, prenom: true, derniereActivite: true },
        orderBy: [{ nom: "asc" }, { prenom: "asc" }],
      },
    },
    orderBy: { nom: "asc" },
  });

  const maintenant = Date.now();

  return classes.map((classe) => ({
    id: classe.id,
    nom: classe.nom,
    eleves: classe.eleves.map((eleve) => ({
      id: eleve.id,
      nom: eleve.nom,
      prenom: eleve.prenom,
      enLigne: !!eleve.derniereActivite && maintenant - eleve.derniereActivite.getTime() < SEUIL_EN_LIGNE_MS,
    })),
  }));
}
