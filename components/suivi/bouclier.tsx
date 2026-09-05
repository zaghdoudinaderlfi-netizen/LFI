import { Shield } from "lucide-react";
import type { PalierBouclier } from "@/lib/suivi-oral-constants";

/** Icône bouclier colorée selon le palier — brique de base réutilisée partout. */
export function IconeBouclier({
  palier,
  taille = "h-6 w-6",
}: {
  palier: PalierBouclier;
  taille?: string;
}) {
  return (
    <Shield
      className={taille}
      style={{ color: palier.couleur }}
      fill={palier.couleur}
      fillOpacity={0.28}
      strokeWidth={2}
      aria-label={`Bouclier ${palier.nom}`}
    />
  );
}

/** Petit badge à poser en incrustation sur un avatar (coin bas-droit). */
export function BadgeBouclierAvatar({
  palier,
  taille = "md",
}: {
  palier: PalierBouclier;
  /** "sm" pour un avatar xs/sm (nav), "md" pour un avatar lg/xl (dashboard, mascotte). */
  taille?: "sm" | "md";
}) {
  const dimensions = taille === "sm" ? "h-3.5 w-3.5" : "h-6 w-6";
  const icone = taille === "sm" ? "h-2.5 w-2.5" : "h-4 w-4";

  return (
    <span
      className={`absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full border-2 border-space-surface bg-space-surface2 ${dimensions}`}
      title={`Palier ${palier.nom}`}
    >
      <IconeBouclier palier={palier} taille={icone} />
    </span>
  );
}

/** Carte de progression complète : bouclier, palier, points, prochain palier. */
export function ProgressionBouclier({
  pointsCumules,
  palier,
  prochainPalier,
  pointsRestants,
}: {
  pointsCumules: number;
  palier: PalierBouclier;
  prochainPalier: PalierBouclier | null;
  pointsRestants: number;
}) {
  const progression = prochainPalier
    ? Math.min(
        100,
        Math.round(((pointsCumules - palier.seuil) / (prochainPalier.seuil - palier.seuil)) * 100)
      )
    : 100;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <IconeBouclier palier={palier} taille="h-14 w-14" />
        <div>
          <p className="font-heading text-xl font-extrabold text-ink-primary">Palier {palier.nom}</p>
          <p className="text-sm text-ink-secondary">{pointsCumules} point{pointsCumules > 1 ? "s" : ""} cumulé{pointsCumules > 1 ? "s" : ""}</p>
        </div>
      </div>

      {prochainPalier ? (
        <div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-space-surface2">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progression}%`, background: prochainPalier.couleur }}
            />
          </div>
          <p className="mt-1.5 text-xs text-ink-muted">
            Encore {pointsRestants} point{pointsRestants > 1 ? "s" : ""} pour le palier {prochainPalier.nom}
          </p>
        </div>
      ) : (
        <p className="text-xs text-ink-muted">Palier maximum atteint 🎉</p>
      )}
    </div>
  );
}
