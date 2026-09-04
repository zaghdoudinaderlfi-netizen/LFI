import { readFile } from "fs/promises";
import path from "path";

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

/** Ouvertures des blocs qui contiennent les solutions. */
const BLOCS_CORRECTION = [
  '<div class="correction-body">', // ch1 / ch2 / ch3
  '<div class="correction">', // ch4 (le conteneur de ch1-3 porte `data-correction`)
];

/**
 * Vide les blocs de correction : les solutions ne sont pas envoyées au
 * navigateur tant que le professeur ne les a pas activées. L'habillage
 * (bouton, cadenas) reste en place.
 */
export function retirerCorrections(html: string): string {
  let resultat = html;

  for (const ouverture of BLOCS_CORRECTION) {
    let index = resultat.indexOf(ouverture);
    while (index !== -1) {
      const debutContenu = index + ouverture.length;
      const finContenu = trouverFermetureDiv(resultat, debutContenu);
      if (finContenu === -1) break;
      resultat = resultat.slice(0, debutContenu) + resultat.slice(finContenu);
      index = resultat.indexOf(ouverture, debutContenu);
    }
  }

  return resultat;
}

/** Position du `</div>` fermant le div déjà ouvert avant `depuis`. */
function trouverFermetureDiv(html: string, depuis: number): number {
  let profondeur = 1;
  let position = depuis;

  while (position < html.length) {
    const ouvrant = html.indexOf("<div", position);
    const fermant = html.indexOf("</div>", position);

    if (fermant === -1) return -1;

    if (ouvrant !== -1 && ouvrant < fermant) {
      profondeur++;
      position = ouvrant + 4;
    } else {
      profondeur--;
      if (profondeur === 0) return fermant;
      position = fermant + 6;
    }
  }

  return -1;
}

/** Signale à la page que les corrections sont autorisées. */
export function activerCorrections(html: string): string {
  return html.replace(
    "</head>",
    "<script>window.__CORRECTION_ACTIVE__ = true;</script>\n</head>"
  );
}
