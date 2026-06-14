// Types et helpers légers pour les champs de "PDF-formulaire", sans dépendance
// à pdf-lib : ce module peut être importé depuis des composants client.

export type ChampFormulaire =
  | { nom: string; type: "texte"; multiligne: boolean; valeur: string }
  | { nom: string; type: "case"; valeur: boolean }
  | { nom: string; type: "choix"; options: string[]; valeur: string };

// Préfixe utilisé pour les champs HTML générés à partir d'un champ de PDF-formulaire,
// afin de les distinguer des autres champs du formulaire de soumission.
export const PREFIXE_CHAMP_FORMULAIRE = "champ__";

// Transforme un nom de champ technique ("Nom_eleve", "date-de-rendu") en libellé lisible.
export function formaterLabelChamp(nom: string): string {
  const propre = nom.replace(/[_\-.]+/g, " ").trim();
  if (!propre) return nom;
  return propre.charAt(0).toUpperCase() + propre.slice(1);
}
