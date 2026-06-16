import { configAvatarUtilisateur, configAvatarSeed, genererAvatarSvg } from "@/lib/avatar";

const TAILLES = {
  xs: "h-6 w-6",
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-16 w-16",
  xl: "h-28 w-28",
} as const;

export type TailleAvatar = keyof typeof TAILLES;

/**
 * Affiche l'avatar Avataaars d'un utilisateur (SVG généré côté serveur ou client).
 * neutre=true → config dérivée du seed (pour les profs sans avatar personnalisé).
 */
export function AvatarDisplay({
  user,
  neutre = false,
  taille = "md",
  className = "",
}: {
  user: { id: string; avatarStyle?: string | null; avatarOptions?: unknown };
  neutre?: boolean;
  taille?: TailleAvatar;
  className?: string;
}) {
  const config = neutre ? configAvatarSeed(user.id) : configAvatarUtilisateur(user);
  const svg = genererAvatarSvg(config, user.id);

  return (
    <span
      role="img"
      aria-label="Avatar"
      className={`inline-flex shrink-0 overflow-hidden rounded-full ${TAILLES[taille]} ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
