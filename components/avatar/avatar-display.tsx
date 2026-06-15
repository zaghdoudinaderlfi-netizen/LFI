import { configAvatarUtilisateur, genererAvatarNeutreSvg, genererAvatarSvg } from "@/lib/avatar";

const TAILLES = {
  xs: "h-6 w-6",
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-16 w-16",
  xl: "h-28 w-28",
} as const;

export type TailleAvatar = keyof typeof TAILLES;

/**
 * Affiche l'avatar d'un utilisateur (élève : config personnalisée ou
 * dérivée de son id ; prof : avatar simple/neutre). Le SVG est généré
 * côté serveur ou client, sans appel réseau (DiceBear local).
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
  const svg = neutre ? genererAvatarNeutreSvg(user.id) : genererAvatarSvg(configAvatarUtilisateur(user), user.id);

  return (
    <span
      role="img"
      aria-label="Avatar"
      className={`inline-flex shrink-0 overflow-hidden rounded-full bg-space-surface2 ring-1 ring-space-border ${TAILLES[taille]} ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
