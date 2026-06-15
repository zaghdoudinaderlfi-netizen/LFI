/** Bloc gris animé (effet de chargement). */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

/** Quelques lignes de texte fantômes. */
export function SkeletonText({ lignes = 3, className = "" }: { lignes?: number; className?: string }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {Array.from({ length: lignes }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === lignes - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}

/** Carte fantôme générique (titre + texte). */
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`card flex flex-col gap-3 p-4 ${className}`}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-5 w-2/3" />
      <SkeletonText lignes={2} />
    </div>
  );
}

/** Liste de cartes fantômes (tableaux de bord, listes de cours...). */
export function SkeletonCardList({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/** Page de chargement générique (titre + cartes). */
export function SkeletonPage({ cartes = 3 }: { cartes?: number }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Skeleton className="h-8 w-48" />
      <SkeletonCardList count={cartes} />
    </div>
  );
}
