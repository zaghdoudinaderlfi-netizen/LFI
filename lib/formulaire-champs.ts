// Types et helpers légers pour les champs de "PDF-formulaire", sans dépendance
// à pdf-lib : ce module peut être importé depuis des composants client.

// Rectangle d'un champ dans le repère PDF (origine en bas à gauche de la page,
// unités en points), exactement comme renvoyé par pdf-lib (getRectangle()).
export type RectanglePdf = { x: number; y: number; largeur: number; hauteur: number };

// Position d'un widget (zone cliquable/éditable) d'un champ sur une page du
// PDF. Un champ texte/case/liste n'a en général qu'une seule position ; un
// groupe de boutons radio en a une par option (valeurOption renseignée).
export type PositionChamp = {
  page: number; // index de page (0 = première page)
  rect: RectanglePdf;
  valeurOption?: string;
};

export type ChampFormulaire =
  | { nom: string; type: "texte"; multiligne: boolean; valeur: string; positions: PositionChamp[] }
  | { nom: string; type: "case"; valeur: boolean; positions: PositionChamp[] }
  | { nom: string; type: "choix"; options: string[]; valeur: string; positions: PositionChamp[] };

// Préfixe utilisé pour les champs HTML générés à partir d'un champ de PDF-formulaire,
// afin de les distinguer des autres champs du formulaire de soumission.
export const PREFIXE_CHAMP_FORMULAIRE = "champ__";

// Mode de remise d'un devoir PDF-formulaire (cf. enum Prisma ModeRemiseFormulaire,
// dont les valeurs sont exactement "EN_LIGNE" | "TELECHARGEMENT"). Dupliqué ici,
// sans dépendance à lib/prisma, pour rester importable depuis des composants client.
export type ModeRemiseFormulaireValeur = "EN_LIGNE" | "TELECHARGEMENT";

export const MODE_REMISE_FORMULAIRE_LABELS: Record<ModeRemiseFormulaireValeur, string> = {
  EN_LIGNE: "En ligne (l'élève remplit les champs directement sur le site)",
  TELECHARGEMENT:
    "Téléchargement (l'élève télécharge le PDF, le remplit dans son lecteur, puis le dépose)",
};

// Transforme un nom de champ technique ("Nom_eleve", "date-de-rendu") en libellé lisible.
export function formaterLabelChamp(nom: string): string {
  const propre = nom.replace(/[_\-.]+/g, " ").trim();
  if (!propre) return nom;
  return propre.charAt(0).toUpperCase() + propre.slice(1);
}
