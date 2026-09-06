"use client";

import { useEffect, useRef, useState } from "react";
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
const INTERVALLE_MS = 8_000;

/** Secoue tout l'écran (pas juste la bulle) en ajoutant brièvement une
 * classe d'animation sur <body> — visible même si l'élève est en train de
 * lire une autre section de la page. */
function secouerEcran() {
  const { body } = document;
  body.classList.remove("animate-shake-screen");
  // Force un reflow pour pouvoir rejouer l'animation même si la classe
  // vient d'être retirée (ex. deux annonces rapprochées).
  void body.offsetWidth;
  body.classList.add("animate-shake-screen");
  setTimeout(() => body.classList.remove("animate-shake-screen"), 600);
}

export function AnnonceBulle({ initial }: { initial: AnnonceEleve | null }) {
  const [annonce, setAnnonce] = useState(initial);
  const [pulse, setPulse] = useState(false);

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
      secouerEcran();
      setPulse(true);
      const timeout = setTimeout(() => setPulse(false), 900);
      try {
        localStorage.setItem(CLE_STOCKAGE, annonce.id);
      } catch {
        // Rien à faire si le stockage est indisponible.
      }
      return () => clearTimeout(timeout);
    }
  }, [annonce]);

  // Interroge régulièrement le serveur pour détecter une nouvelle annonce
  // (ou sa disparition) sans que l'élève ait besoin de recharger la page.
  const annonceRef = useRef(annonce);
  annonceRef.current = annonce;

  useEffect(() => {
    let annule = false;

    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/annonces/active", { cache: "no-store" });
        if (!res.ok || annule) return;
        const fraiche: AnnonceEleve | null = await res.json();
        const actuelle = annonceRef.current;
        if (fraiche?.id !== actuelle?.id) {
          setAnnonce(fraiche);
        }
      } catch {
        // Tick raté (réseau, etc.) — sans conséquence, on réessaiera au prochain intervalle.
      }
    }, INTERVALLE_MS);

    return () => {
      annule = true;
      clearInterval(id);
    };
  }, []);

  if (!annonce) return null;

  return (
    <div
      className={`animate-fade-in-up relative overflow-hidden rounded-2xl border-2 p-6 shadow-lg transition-transform ${
        pulse ? "scale-[1.015]" : ""
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
