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
 * Paramètres de lecture appliqués à tous nos lecteurs : on retire ce que les
 * plateformes ajoutent *autour* de la vidéo — vidéos suggérées en fin de
 * lecture, annotations, titre et nom de la chaîne — pour ne laisser que
 * l'image. `fs=1` garde le plein écran, que l'iframe autorise par ailleurs
 * via `allowFullScreen`.
 *
 * Limite à connaître : le logo YouTube et le bouton « Regarder sur YouTube »
 * de la barre de contrôle ne sont PAS supprimables. Le paramètre
 * `modestbranding` qui les atténuait a été retiré par YouTube en 2023, et
 * leurs conditions d'utilisation imposent ces éléments sur tout lecteur
 * intégré. Vimeo, lui, se laisse entièrement débrander (`title`, `byline`,
 * `portrait`).
 */
const PARAMS_LECTEUR: Record<VideoEmbed["plateforme"], string> = {
  // rel=0 : pas de vidéos d'autres chaînes à la fin ; iv_load_policy=3 : pas
  // d'annotations ; playsinline=1 : pas de plein écran forcé sur iPhone.
  youtube: "rel=0&iv_load_policy=3&playsinline=1&fs=1&color=white",
  // dnt=1 : Vimeo ne pose pas de cookie de suivi.
  vimeo: "title=0&byline=0&portrait=0&dnt=1",
};

/** Ajoute les paramètres du lecteur épuré à une URL d'intégration. */
export function avecParametresLecteur(
  embedUrl: string,
  plateforme: VideoEmbed["plateforme"]
): string {
  const separateur = embedUrl.includes("?") ? "&" : "?";
  return `${embedUrl}${separateur}${PARAMS_LECTEUR[plateforme]}`;
}

/**
 * Renvoie l'embed YouTube/Vimeo correspondant à l'URL collée par le prof,
 * ou null si l'URL ne correspond à aucune des deux plateformes supportées.
 */
export function extraireEmbedVideo(url: string): VideoEmbed | null {
  const propre = url.trim();
  if (!propre) return null;

  const mYoutube = propre.match(REGEX_YOUTUBE);
  if (mYoutube) {
    return {
      plateforme: "youtube",
      embedUrl: avecParametresLecteur(
        `https://www.youtube-nocookie.com/embed/${mYoutube[1]}`,
        "youtube"
      ),
    };
  }

  const mVimeo = propre.match(REGEX_VIMEO);
  if (mVimeo) {
    return {
      plateforme: "vimeo",
      embedUrl: avecParametresLecteur(`https://player.vimeo.com/video/${mVimeo[1]}`, "vimeo"),
    };
  }

  return null;
}
