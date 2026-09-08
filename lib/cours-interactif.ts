import { readFile } from "fs/promises";
import path from "path";
import * as cheerio from "cheerio";

// Les pages d'exercices vivent hors de public/ : elles passent par la route
// /cours/[fichier], qui décide côté serveur si les corrections partent dans
// la réponse. Servies statiquement, n'importe quel élève pourrait les lire
// dans le code source de la page.
const DOSSIER_PAGES = path.join(process.cwd(), "contenu", "cours");

export function estNomPageValide(fichier: string): boolean {
  return /^[a-z0-9][a-z0-9-]*\.html$/.test(fichier);
}

export async function lirePageInteractive(fichier: string): Promise<string> {
  return readFile(path.join(DOSSIER_PAGES, fichier), "utf-8");
}

/**
 * Vide les blocs de correction : les solutions ne sont pas envoyées au
 * navigateur tant que le professeur ne les a pas activées. L'habillage
 * (bouton, cadenas) reste en place.
 *
 * `.correction-body` (ch1/ch2/ch3) est le contenu de la solution, imbriqué
 * dans un conteneur `.correction[data-correction]` qui porte le bouton et
 * le cadenas — seul le contenu doit être vidé. `.correction` sans
 * `data-correction` (ch4) EST directement la solution : c'est lui qu'on vide.
 */
export function retirerCorrections(html: string): string {
  const $ = cheerio.load(html);
  $(".correction-body").empty();
  $(".correction:not([data-correction])").empty();
  return $.html();
}

/** Signale à la page que les corrections sont autorisées. */
export function activerCorrections(html: string): string {
  return html.replace(
    "</head>",
    "<script>window.__CORRECTION_ACTIVE__ = true;</script>\n</head>"
  );
}

export type ContexteEleveDepot = {
  moi: { id: string; nom: string };
  camarades: { id: string; nom: string }[];
};

/**
 * Injecte l'identité de l'élève connecté et la liste de ses camarades de
 * classe : le widget de dépôt de compte-rendu peut alors se passer de
 * saisie libre (voir __CONTEXTE_ELEVE__ dans le script du widget).
 */
export function injecterContexteEleve(html: string, contexte: ContexteEleveDepot): string {
  // Échappe "<" pour qu'aucune séquence "</script>" dans un nom ne puisse
  // casser hors du tag (les noms viennent de la base, pas de l'utilisateur
  // courant, mais un autre élève a pu saisir le sien à l'inscription).
  const json = JSON.stringify(contexte).replace(/</g, "\\u003c");
  return html.replace(
    "</head>",
    `<script>window.__CONTEXTE_ELEVE__ = ${json};</script>\n</head>`
  );
}
