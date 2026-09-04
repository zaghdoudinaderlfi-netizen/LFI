// Extraction d'ID vidéo pour le cours de type VIDEO du formulaire simplifié.
// L'embedUrl est toujours reconstruite à partir de l'ID extrait (jamais de
// l'URL brute collée par le prof) pour ne jamais placer d'entrée utilisateur
// non validée dans un `iframe src`.

export type VideoEmbed = {
  plateforme: "youtube" | "vimeo";
  embedUrl: string;
};

const REGEX_YOUTUBE =
  /(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

const REGEX_VIMEO = /vimeo\.com\/(?:video\/)?(\d+)/;

/**
 * Renvoie l'embed YouTube/Vimeo correspondant à l'URL collée par le prof,
 * ou null si l'URL ne correspond à aucune des deux plateformes supportées.
 */
export function extraireEmbedVideo(url: string): VideoEmbed | null {
  const propre = url.trim();
  if (!propre) return null;

  const mYoutube = propre.match(REGEX_YOUTUBE);
  if (mYoutube) {
    return { plateforme: "youtube", embedUrl: `https://www.youtube-nocookie.com/embed/${mYoutube[1]}` };
  }

  const mVimeo = propre.match(REGEX_VIMEO);
  if (mVimeo) {
    return { plateforme: "vimeo", embedUrl: `https://player.vimeo.com/video/${mVimeo[1]}` };
  }

  return null;
}
