"use client";

import { useEffect } from "react";

const INTERVALLE_MS = 20_000;

/**
 * Signale périodiquement que l'élève est connecté (voir lib/presence.ts —
 * un prof est considéré déconnecté après ~45s sans battement). Ne rend rien
 * à l'écran.
 */
export function PresenceHeartbeat() {
  useEffect(() => {
    const envoyer = () => {
      fetch("/api/presence/heartbeat", { method: "POST", cache: "no-store" }).catch(() => {
        // Battement raté (réseau, etc.) — sans conséquence, on réessaiera au prochain intervalle.
      });
    };

    envoyer();
    const id = setInterval(envoyer, INTERVALLE_MS);
    return () => clearInterval(id);
  }, []);

  return null;
}
