"use client";

import { useState } from "react";
import { Smartphone, X, Share, PlusSquare, Check } from "lucide-react";
import { usePwaInstall } from "@/lib/use-pwa-install";

/**
 * Bouton "Installer l'application", à placer dans les en-têtes du site.
 * - Android/Chrome/Edge : déclenche l'invite native beforeinstallprompt.
 * - iPhone/iPad (Safari, qui ne propose jamais d'invite native) : ouvre une
 *   modale avec les 3 étapes manuelles (bouton Partager → Sur l'écran
 *   d'accueil → Ajouter).
 * - Autre navigateur (invite pas encore captée) : modale avec une astuce
 *   générique plutôt qu'un clic sans effet.
 * Se cache automatiquement une fois l'app installée (mode standalone).
 */
export function InstallAppButton({
  compact = false,
  className = "",
}: {
  /** Icône seule (sans libellé), pour les barres d'en-tête étroites. */
  compact?: boolean;
  className?: string;
}) {
  const { canInstallNative, isIOS, isStandalone, promptInstall } = usePwaInstall();
  const [modale, setModale] = useState<"ios" | "generique" | null>(null);

  if (isStandalone) return null;

  async function handleClick() {
    if (canInstallNative) {
      await promptInstall();
      return;
    }
    setModale(isIOS ? "ios" : "generique");
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Installer l'application"
        title="Installer l'application"
        className={compact ? `btn-ghost !px-2 ${className}` : `btn-secondary ${className}`}
      >
        <Smartphone className="h-5 w-5" aria-hidden />
        {!compact && <span>📲 Installer l&apos;application</span>}
      </button>

      {modale && <InstallInstructionsModal type={modale} onClose={() => setModale(null)} />}
    </>
  );
}

function InstallInstructionsModal({
  type,
  onClose,
}: {
  type: "ios" | "generique";
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-modal-titre"
        className="relative w-full max-w-sm rounded-2xl border-2 border-space-border bg-space-surface p-5 shadow-2xl animate-fade-in-up"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="install-modal-titre" className="section-title flex items-center gap-2">
            📲 Installer l&apos;application
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-space-surface2 hover:text-ink-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {type === "ios" ? (
          <ol className="flex flex-col gap-4">
            <Etape numero={1} icone={<Share className="h-5 w-5" />}>
              Appuie sur le bouton <strong>Partager</strong> (le carré avec la flèche) en bas de Safari.
            </Etape>
            <Etape numero={2} icone={<PlusSquare className="h-5 w-5" />}>
              Fais défiler et appuie sur <strong>« Sur l&apos;écran d&apos;accueil »</strong>.
            </Etape>
            <Etape numero={3} icone={<Check className="h-5 w-5" />}>
              Appuie sur <strong>Ajouter</strong> en haut à droite.
            </Etape>
          </ol>
        ) : (
          <p className="text-sm leading-relaxed text-ink-secondary">
            Ouvre le menu de ton navigateur (souvent en haut à droite, icône ⋮ ou ☰) puis choisis{" "}
            <strong>« Installer l&apos;application »</strong> ou{" "}
            <strong>« Ajouter à l&apos;écran d&apos;accueil »</strong>.
          </p>
        )}

        <button type="button" onClick={onClose} className="btn-primary mt-5 w-full">
          Compris !
        </button>
      </div>
    </div>
  );
}

function Etape({
  numero,
  icone,
  children,
}: {
  numero: number;
  icone: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neon-cyan/10 font-bold text-neon-cyan">
        {numero}
      </span>
      <span className="flex-1 pt-1 text-sm text-ink-secondary">{children}</span>
      <span className="shrink-0 pt-1 text-ink-muted">{icone}</span>
    </li>
  );
}
