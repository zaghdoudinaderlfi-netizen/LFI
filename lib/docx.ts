import { randomUUID } from "crypto";
import mammoth from "mammoth";
import { assurerBucketPublic, supabaseAdmin, BUCKET_IMAGES_COURS } from "./supabase";
import { nettoyerHtml } from "./sanitize-html";

export class DocxError extends Error {}

function extensionPourType(contentType: string): string {
  const sousType = contentType.split("/")[1]?.split("+")[0]?.toLowerCase();
  switch (sousType) {
    case "jpeg":
      return "jpg";
    case "svg":
    case "svg-xml":
      return "svg";
    default:
      return sousType || "png";
  }
}

/**
 * Convertit un fichier Word (.docx) en HTML prêt à être stocké et affiché
 * comme contenu de cours. Chaque image du document est extraite et envoyée
 * dans le bucket public `images-cours-lfi` (sous-dossier `coursId/`), dans
 * l'ordre où elle apparaît dans le document.
 */
export async function convertirDocxEnHtml(buffer: Buffer, coursId: string): Promise<string> {
  await assurerBucketPublic(BUCKET_IMAGES_COURS);

  let html: string;

  try {
    const resultat = await mammoth.convertToHtml(
      { buffer },
      {
        convertImage: mammoth.images.imgElement(async (image) => {
          const contentType = image.contentType || "image/png";
          const extension = extensionPourType(contentType);
          const donnees = await image.readAsBuffer();
          const chemin = `${coursId}/${randomUUID()}.${extension}`;

          const { error } = await supabaseAdmin.storage
            .from(BUCKET_IMAGES_COURS)
            .upload(chemin, donnees, { contentType, upsert: false });

          if (error) {
            throw new DocxError("Échec de l'envoi d'une image du document.");
          }

          const { data } = supabaseAdmin.storage.from(BUCKET_IMAGES_COURS).getPublicUrl(chemin);
          return { src: data.publicUrl };
        }),
      }
    );
    html = resultat.value;
  } catch (error) {
    if (error instanceof DocxError) throw error;
    throw new DocxError("Impossible de lire ce fichier Word.");
  }

  return nettoyerHtml(html);
}

/**
 * Supprime toutes les images stockées pour un cours (utilisé lors d'un
 * remplacement de contenu pour éviter d'accumuler des fichiers orphelins).
 */
export async function supprimerImagesCours(coursId: string) {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET_IMAGES_COURS).list(coursId);
  if (error || !data || data.length === 0) return;

  const chemins = data.map((fichier) => `${coursId}/${fichier.name}`);
  await supabaseAdmin.storage.from(BUCKET_IMAGES_COURS).remove(chemins);
}
