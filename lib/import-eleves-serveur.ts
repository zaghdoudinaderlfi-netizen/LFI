// Création en masse des comptes élèves (accès Prisma) — voir la logique pure
// (analyse de fichier, génération des identifiants) dans lib/import-eleves.ts.
// Séparé de ce fichier pour ne jamais entraîner "server-only"/Prisma dans le
// bundle client via app/prof/admin/import-eleves-modal.tsx.

import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { genererMdpTemporaire } from "./utilisateurs";
import { IDENTIFIANT_REGEX, type LigneAvecIdentifiant, type ResultatCreationEleve } from "./import-eleves";

export class ImportError extends Error {}

export async function importerEleves(
  classeId: string,
  lignes: LigneAvecIdentifiant[],
): Promise<ResultatCreationEleve[]> {
  if (lignes.length === 0) {
    throw new ImportError("Aucun élève à importer.");
  }

  const classe = await prisma.classe.findUnique({ where: { id: classeId }, select: { id: true } });
  if (!classe) {
    throw new ImportError("Classe introuvable.");
  }

  const identifiants = lignes.map((l) => l.identifiant.trim().toLowerCase());

  for (const [i, identifiant] of identifiants.entries()) {
    if (!IDENTIFIANT_REGEX.test(identifiant)) {
      throw new ImportError(
        `Identifiant invalide pour ${lignes[i].prenom} ${lignes[i].nom} : "${lignes[i].identifiant}" (lettres/chiffres uniquement, 2 à 30 caractères, commence par une lettre).`,
      );
    }
    if (!lignes[i].nom.trim() || !lignes[i].prenom.trim()) {
      throw new ImportError("Nom et prénom sont obligatoires pour chaque élève.");
    }
  }

  const doublonsLocaux = identifiants.filter((id, i) => identifiants.indexOf(id) !== i);
  if (doublonsLocaux.length > 0) {
    throw new ImportError(`Identifiant en double dans le fichier : ${[...new Set(doublonsLocaux)].join(", ")}.`);
  }

  const dejaPris = await prisma.user.findMany({
    where: { identifiant: { in: identifiants } },
    select: { identifiant: true },
  });
  if (dejaPris.length > 0) {
    throw new ImportError(
      `Identifiant déjà utilisé : ${dejaPris.map((u) => u.identifiant).join(", ")}.`,
    );
  }

  const comptes = await Promise.all(
    lignes.map(async (ligne, i) => {
      const motDePasseTemp = genererMdpTemporaire();
      const hash = await bcrypt.hash(motDePasseTemp, 12);
      return {
        nom: ligne.nom.trim(),
        prenom: ligne.prenom.trim(),
        identifiant: identifiants[i],
        motDePasseTemp,
        motDePasse: hash,
      };
    }),
  );

  await prisma.user.createMany({
    data: comptes.map(({ motDePasseTemp: _motDePasseTemp, ...compte }) => ({
      ...compte,
      role: "ELEVE" as const,
      classeId,
      doitChangerMdp: true,
    })),
  });

  return comptes.map((c) => ({
    nomComplet: `${c.prenom} ${c.nom}`,
    identifiant: c.identifiant,
    motDePasseTemp: c.motDePasseTemp,
  }));
}
