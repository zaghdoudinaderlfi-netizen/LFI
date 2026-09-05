"use client";

import { useEffect, useRef } from "react";
import { jouerSonGeneral, jouerSonNote } from "@/lib/notification-sound";

const INTERVALLE_MS = 20_000;

type CompteParType = { GENERALE: number; NOTE: number };

/**
 * Interroge périodiquement le nombre de notifications non lues et joue un
 * son quand il augmente — un carillon pour une note reçue, un ton neutre
 * pour le reste. Ne rend rien à l'écran ; ne joue jamais de son au premier
 * chargement (seulement sur une nouvelle arrivée détectée en cours de
 * session).
 */
export function NotificationSon({ initial }: { initial: CompteParType }) {
  const precedent = useRef<CompteParType>(initial);

  useEffect(() => {
    let annule = false;

    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/notifications/compte", { cache: "no-store" });
        if (!res.ok || annule) return;
        const compte: CompteParType = await res.json();

        if (compte.NOTE > precedent.current.NOTE) {
          jouerSonNote();
        } else if (compte.GENERALE > precedent.current.GENERALE) {
          jouerSonGeneral();
        }
        precedent.current = compte;
      } catch {
        // Tick raté (réseau, etc.) — sans conséquence, on réessaiera au prochain intervalle.
      }
    }, INTERVALLE_MS);

    return () => {
      annule = true;
      clearInterval(id);
    };
  }, []);

  return null;
}
