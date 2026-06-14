import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { SCHEMA_CONTENU_COURS } from "./sanitize-html";

/**
 * Convertit un contenu Markdown / MDX existant en HTML statique.
 *
 * Utilisé uniquement pour migrer les anciens cours rédigés en Markdown
 * (avant la suppression du champ MDX) vers le nouveau format HTML stocké
 * en base. Le HTML obtenu est nettoyé via le même schéma que celui
 * appliqué aux imports Word.
 */
export async function markdownVersHtml(markdown: string): Promise<string> {
  if (!markdown.trim()) return "";

  const fichier = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, SCHEMA_CONTENU_COURS)
    .use(rehypeStringify)
    .process(markdown);

  return String(fichier).trim();
}
