"use client";

import { useEffect, useState } from "react";
import { Download, Megaphone, Paperclip } from "lucide-react";
import { jouerSonAnnonce } from "@/lib/notification-sound";
import { formaterTaille } from "@/lib/fichiers";

export type AnnonceEleve = {
  id: string;
  message: string;
  fichierNom: string | null;
  fichierTaille: number | null;
};

const CLE_STOCKAGE = "nadtech-annonce-vue";

export function AnnonceBulle({ annonce }: { annonce: AnnonceEleve | null }) {
  const [secousse, setSecousse] = useState(false);

  useEffect(() => {
    if (!annonce) return;

    let dejaVue = false;
    try {
      dejaVue = localStorage.getItem(CLE_STOCKAGE) === annonce.id;
    } catch {
      // localStorage indisponible (navigation privée...) : on rejoue à
      // chaque fois, ce n'est pas grave.
    }

    if (!dejaVue) {
      jouerSonAnnonce();
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([180, 90, 180]);
      }
      setSecousse(true);
      const timeout = setTimeout(() => setSecousse(false), 550);
      try {
        localStorage.setItem(CLE_STOCKAGE, annonce.id);
      } catch {
        // Rien à faire si le stockage est indisponible.
      }
      return () => clearTimeout(timeout);
    }
  }, [annonce]);

  if (!annonce) return null;

  return (
    <div
      className={`animate-fade-in-up relative overflow-hidden rounded-2xl border-2 p-6 shadow-lg ${
        secousse ? "animate-shake-screen" : ""
      }`}
      style={{
        borderColor: "rgb(var(--neon-violet))",
        background:
          "linear-gradient(135deg, rgba(139,92,246,0.16), rgba(34,211,238,0.10) 55%, rgba(236,72,153,0.14))",
        boxShadow: "0 0 0 1px rgba(139,92,246,0.25), 0 18px 40px -18px rgba(139,92,246,0.55)",
      }}
      role="status"
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-40 animate-glow-pulse"
        style={{ background: "rgb(var(--neon-violet))", filter: "blur(40px)" }}
      />
      <div className="relative flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ background: "rgba(139,92,246,0.2)", color: "rgb(var(--neon-violet))" }}
          >
            <Megaphone className="h-5 w-5" />
          </span>
          <p className="font-mono text-xs font-bold uppercase tracking-widest" style={{ color: "rgb(var(--neon-violet))" }}>
            📣 Message de ton professeur
          </p>
        </div>

        <p className="whitespace-pre-wrap text-base font-medium text-ink-primary">{annonce.message}</p>

        {annonce.fichierNom && (
          <a
            href={`/api/annonces/${annonce.id}/fichier`}
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-space-border bg-space-surface/80 px-4 py-2 text-sm font-medium text-ink-primary transition-colors hover:border-neon-violet/50"
          >
            <Paperclip className="h-4 w-4 shrink-0" style={{ color: "rgb(var(--neon-violet))" }} />
            <span className="truncate">{annonce.fichierNom}</span>
            {annonce.fichierTaille != null && (
              <span className="text-xs text-ink-muted">({formaterTaille(annonce.fichierTaille)})</span>
            )}
            <Download className="h-4 w-4 shrink-0" />
          </a>
        )}
      </div>
    </div>
  );
}
