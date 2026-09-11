// Helpers partagés pour la gestion des fichiers (pièces jointes, sujets de devoirs, rendus).

export const TAILLE_MAX_OCTETS = 10 * 1024 * 1024; // 10 Mo

export const EXTENSIONS_DOCUMENTS = new Set(["pdf", "jpg", "jpeg", "png", "webp", "pptx"]);

export function extensionDe(nomFichier: string): string {
  const parts = nomFichier.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

export function nomFichierSur(nomFichier: string): string {
  // Garde uniquement le nom de fichier, sans chemin ni caractères spéciaux.
  const base = nomFichier.split(/[/\\]/).pop() ?? "fichier";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function formaterTaille(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(1)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

/** Retire les accents et caractères non-alphanum pour un nom de fichier de téléchargement sûr. */
export function slugifier(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
