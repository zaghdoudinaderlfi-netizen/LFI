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

// Transforme un nom de champ technique ("Nom_eleve", "date-de-rendu") en libellé lisible.
export function formaterLabelChamp(nom: string): string {
  const propre = nom.replace(/[_\-.]+/g, " ").trim();
  if (!propre) return nom;
  return propre.charAt(0).toUpperCase() + propre.slice(1);
}
