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
  badge,
}: {
  user: { id: string; avatarStyle?: string | null; avatarOptions?: unknown };
  neutre?: boolean;
  taille?: TailleAvatar;
  className?: string;
  /** Incrustation optionnelle (ex. bouclier de palier) posée sur l'avatar. */
  badge?: React.ReactNode;
}) {
  const config = neutre ? configAvatarSeed(user.id) : configAvatarUtilisateur(user);
  const svg = genererAvatarSvg(config, user.id);

  return (
    <span className={`relative inline-flex shrink-0 ${TAILLES[taille]} ${className}`}>
      <span
        role="img"
        aria-label="Avatar"
        className="h-full w-full overflow-hidden rounded-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {badge}
    </span>
  );
}
