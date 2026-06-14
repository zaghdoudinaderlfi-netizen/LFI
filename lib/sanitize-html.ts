import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeSanitize, { defaultSchema, type Options as Schema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

// Schéma de nettoyage du contenu des cours : on part du schéma par défaut
// (basé sur celui de GitHub, qui autorise déjà titres, listes, tableaux,
// images, <details>/<summary>, etc.) et on autorise en plus les classes
// CSS générées par mammoth sur les listes pour préserver leur style.
export const SCHEMA_CONTENU_COURS: Schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "u"],
  attributes: {
    ...defaultSchema.attributes,
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "className"],
  },
};

/**
 * Nettoie un fragment HTML (issu de mammoth ou d'une conversion Markdown)
 * avant de le stocker en base : retire les balises/attributs dangereux
 * (scripts, gestionnaires d'évènements, styles inline, etc.).
 */
export async function nettoyerHtml(html: string): Promise<string> {
  const fichier = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeSanitize, SCHEMA_CONTENU_COURS)
    .use(rehypeStringify)
    .process(html);

  return String(fichier).trim();
}
