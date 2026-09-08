"use client";

import { useEffect, useRef, useState } from "react";
import { Hand } from "lucide-react";

const INTERVALLE_MS = 10_000;

/**
 * Bouton flottant pour lever la main (participation à l'oral) — visible sur
 * tout le tableau de bord élève. Interroge périodiquement le serveur pour
 * détecter que le prof a baissé la main depuis sa popup (voir
 * components/prof/mains-levees-bulle.tsx), sans que l'élève ait besoin de
 * recharger la page.
 */
export function LeverMainBouton({ initial }: { initial: boolean }) {
  const [levee, setLevee] = useState(initial);
  const [enCours, setEnCours] = useState(false);
  const leveeRef = useRef(levee);
  leveeRef.current = levee;

  useEffect(() => {
    let annule = false;

    const rafraichir = async () => {
      try {
        const res = await fetch("/api/mains-levees", { cache: "no-store" });
        if (!res.ok || annule) return;
        const { actif } = await res.json();
        if (!annule && actif !== leveeRef.current) {
          setLevee(actif);
        }
      } catch {
        // Tick raté (réseau, etc.) — sans conséquence, on réessaiera au prochain intervalle.
      }
    };

    const id = setInterval(rafraichir, INTERVALLE_MS);
    return () => {
      annule = true;
      clearInterval(id);
    };
  }, []);

  async function basculer() {
    if (enCours) return;
    setEnCours(true);
    const prochainEtat = !levee;
    try {
      const res = await fetch("/api/mains-levees", { method: prochainEtat ? "POST" : "DELETE" });
      if (res.ok) setLevee(prochainEtat);
    } catch {
      // Rien à faire — l'élève peut retenter.
    } finally {
      setEnCours(false);
    }
  }

  return (
    <button
      type="button"
      onClick={basculer}
      disabled={enCours}
      aria-pressed={levee}
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border-2 px-4 py-3 font-medium transition-all ${
        levee
          ? "animate-glow-pulse border-amber-400 bg-amber-400/15 text-amber-300"
          : "border-space-border bg-space-surface text-ink-primary hover:scale-105"
      } ${enCours ? "opacity-70" : ""}`}
      style={{ boxShadow: "3px 3px 0 rgb(var(--arcade-shadow-clr))" }}
    >
      <Hand className={`h-5 w-5 shrink-0 ${levee ? "animate-wiggle" : ""}`} />
      <span className="hidden sm:inline">{levee ? "Main levée — en attente" : "Lever la main"}</span>
    </button>
  );
}
