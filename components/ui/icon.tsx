/**
 * Icône colorée du sprite public/icons/nadtech-icones-dashboard.svg — voir
 * IconSprite (app/layout.tsx) qui injecte le sprite une seule fois à la
 * racine pour que tous les <symbol> soient disponibles ici via <use>.
 */
export function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <svg className={className} aria-hidden="true" focusable="false">
      <use href={`#icon-${name}`} />
    </svg>
  );
}
