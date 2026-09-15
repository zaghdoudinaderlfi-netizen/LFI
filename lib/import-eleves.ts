// Import en masse d'élèves depuis un fichier (CSV ou Excel) : logique pure
// (analyse du fichier, génération des identifiants), sans accès base de
// données — importable depuis un Client Component (voir
// app/prof/admin/import-eleves-modal.tsx). La création réelle des comptes
// (accès Prisma) est dans lib/import-eleves-serveur.ts.

export type LigneApercuImport = {
  ligne: number;
  nom: string;
  prenom: string;
  statut: "ok" | "avertissement";
  avertissement?: string;
};

export type ResultatApercuImport =
  | { ok: true; lignes: LigneApercuImport[] }
  | { ok: false; erreur: string };

function normaliser(valeur: string): string {
  return valeur
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

function trouverColonnes(entetes: string[]): { indexNom: number; indexPrenom: number } | null {
  const normalisees = entetes.map(normaliser);
  const indexPrenom = normalisees.findIndex((h) => h.includes("prenom"));
  const indexNom = normalisees.findIndex((h) => h.includes("nom") && !h.includes("prenom"));
  if (indexNom === -1 || indexPrenom === -1) return null;
  return { indexNom, indexPrenom };
}

export function analyserLignesImport(lignesBrutes: string[][]): ResultatApercuImport {
  const lignesNonVides = lignesBrutes.filter((ligne) => ligne.some((c) => c.trim() !== ""));
  if (lignesNonVides.length === 0) {
    return { ok: false, erreur: "Le fichier est vide." };
  }

  const [entetes, ...reste] = lignesNonVides;
  const colonnes = trouverColonnes(entetes);
  if (!colonnes) {
    return {
      ok: false,
      erreur:
        'Colonnes "Nom" et "Prénom" introuvables. La première ligne du fichier doit contenir ces en-têtes.',
    };
  }

  if (reste.length === 0) {
    return { ok: false, erreur: "Aucun élève trouvé après la ligne d'en-tête." };
  }

  const lignes: LigneApercuImport[] = reste.map((champs, i) => {
    const nom = (champs[colonnes.indexNom] ?? "").trim();
    const prenom = (champs[colonnes.indexPrenom] ?? "").trim();
    const ligne = i + 2; // +1 : ligne d'en-tête, +1 : index 1-based

    if (!nom && !prenom) {
      return { ligne, nom, prenom, statut: "avertissement", avertissement: "Ligne vide." };
    }
    if (!nom) {
      return { ligne, nom, prenom, statut: "avertissement", avertissement: "Nom manquant." };
    }
    if (!prenom) {
      return { ligne, nom, prenom, statut: "avertissement", avertissement: "Prénom manquant." };
    }
    return { ligne, nom, prenom, statut: "ok" };
  });

  return { ok: true, lignes };
}

// ── Génération des identifiants de connexion ──────────────────────────────────

// Garde uniquement les lettres (a-z) : un identifiant ne doit pas dépendre
// d'accents/espaces/apostrophes que l'élève retape ensuite pour se connecter.
function normaliserPourIdentifiant(valeur: string): string {
  return normaliser(valeur).replace(/[^a-z]/g, "");
}

export type LigneAvecIdentifiant = { nom: string; prenom: string; identifiant: string };
export type ResultatCreationEleve = { nomComplet: string; identifiant: string; motDePasseTemp: string };

export const IDENTIFIANT_REGEX = /^[a-z][a-z0-9]{1,29}$/;

/**
 * Propose un identifiant unique par ligne (1ère lettre du prénom + nom, puis
 * suffixe numérique en cas de doublon), en tenant compte des identifiants
 * déjà pris en base ET des lignes précédentes du même import. Pure — ne
 * touche pas la base ; l'appelant fournit les identifiants déjà pris.
 */
export function genererIdentifiantsUniques(
  lignes: { nom: string; prenom: string }[],
  identifiantsDejaPris: Iterable<string>,
): LigneAvecIdentifiant[] {
  const pris = new Set(identifiantsDejaPris);
  return lignes.map(({ nom, prenom }) => {
    const base = normaliserPourIdentifiant(prenom.charAt(0) + nom) || "eleve";
    let candidat = base;
    let suffixe = 2;
    while (pris.has(candidat)) {
      candidat = `${base}${suffixe}`;
      suffixe++;
    }
    pris.add(candidat);
    return { nom, prenom, identifiant: candidat };
  });
}
