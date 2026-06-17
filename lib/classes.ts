import { Niveau } from "@prisma/client";
import { prisma } from "./prisma";

export { NIVEAU_LABELS } from "./classes-constants";

export class ClasseError extends Error {}

const PREFIXES_NIVEAU: Record<Niveau, string> = {
  TROISIEME: "3",
  SECONDE: "2",
};

const ANNEE_SCOLAIRE_REGEX = /^(\d{4})-(\d{4})$/;

async function genererCodeInscription(niveau: Niveau, anneeScolaire: string) {
  const annee = anneeScolaire.match(ANNEE_SCOLAIRE_REGEX)?.[2] ?? anneeScolaire;
  const prefixe = PREFIXES_NIVEAU[niveau];

  for (let i = 0; i < 26; i++) {
    const lettre = String.fromCharCode(65 + i);
    const code = `${prefixe}${lettre}-${annee}`;
    const existant = await prisma.classe.findUnique({
      where: { codeInscription: code },
      select: { id: true },
    });
    if (!existant) return code;
  }

  throw new ClasseError(
    "Impossible de générer un code de classe unique pour ce niveau et cette année."
  );
}

export async function creerClasse({
  nom,
  niveau,
  anneeScolaire,
}: {
  nom: string;
  niveau: Niveau;
  anneeScolaire: string;
}) {
  if (!nom.trim()) {
    throw new ClasseError("Le nom de la classe est obligatoire.");
  }

  if (!ANNEE_SCOLAIRE_REGEX.test(anneeScolaire)) {
    throw new ClasseError(
      "L'année scolaire doit être au format AAAA-AAAA (ex. 2025-2026)."
    );
  }

  const codeInscription = await genererCodeInscription(niveau, anneeScolaire);

  return prisma.classe.create({
    data: {
      nom: nom.trim(),
      niveau,
      anneeScolaire,
      codeInscription,
    },
  });
}

export async function listerClasses() {
  const classes = await prisma.classe.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { eleves: true } } },
  });

  return classes.map((classe) => ({
    id: classe.id,
    nom: classe.nom,
    niveau: classe.niveau,
    anneeScolaire: classe.anneeScolaire,
    codeInscription: classe.codeInscription,
    nombreEleves: classe._count.eleves,
  }));
}

export function anneeScolaireParDefaut() {
  const maintenant = new Date();
  const annee = maintenant.getFullYear();
  // L'année scolaire commence en septembre (mois index 8).
  const debut = maintenant.getMonth() >= 8 ? annee : annee - 1;
  return `${debut}-${debut + 1}`;
}
