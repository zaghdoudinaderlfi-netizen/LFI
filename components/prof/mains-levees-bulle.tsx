"use client";

import { useEffect, useRef, useState } from "react";
import { Hand, X } from "lucide-react";
import { jouerSonMainLevee } from "@/lib/notification-sound";

const INTERVALLE_MS = 5_000;

type MainLeveeActive = {
  id: string;
  eleveId: string;
  nom: string;
  prenom: string | null;
  classeNom: string | null;
  depuis: string;
};

function depuisTexte(depuis: string) {
  const secondes = Math.max(0, Math.floor((Date.now() - new Date(depuis).getTime()) / 1000));
  if (secondes < 60) return `${secondes}s`;
  const minutes = Math.floor(secondes / 60);
  return `${minutes} min`;
}

/**
 * Bulle flottante (façon BullePresence) : liste en direct des élèves ayant
 * levé la main pour participer à l'oral. Toujours interrogée (même fermée)
 * pour jouer un son et vibrer dès qu'une nouvelle main se lève, comme
 * AnnonceBulle côté élève.
 */
export function MainsLeveesBulle() {
  const [ouvert, setOuvert] = useState(false);
  const [mains, setMains] = useState<MainLeveeActive[]>([]);
  const idsConnusRef = useRef<Set<string>>(new Set());
  const premierChargementRef = useRef(true);
  const [, forceRender] = useState(0);

  useEffect(() => {
    let annule = false;

    const rafraichir = async () => {
      try {
        const res = await fetch("/api/mains-levees/actives", { cache: "no-store" });
        if (!res.ok || annule) return;
        const fraiches: MainLeveeActive[] = await res.json();

        const idsFrais = new Set(fraiches.map((m) => m.id));
        const nouvelles = fraiches.some((m) => !idsConnusRef.current.has(m.id));

        if (nouvelles && !premierChargementRef.current) {
          jouerSonMainLevee();
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([120, 60, 120]);
          }
        }

        premierChargementRef.current = false;
        idsConnusRef.current = idsFrais;
        setMains(fraiches);
      } catch {
        // Tick raté (réseau, etc.) — sans conséquence, on réessaiera au prochain intervalle.
      }
    };

    rafraichir();
    const id = setInterval(rafraichir, INTERVALLE_MS);
    return () => {
      annule = true;
      clearInterval(id);
    };
  }, []);

  // Rafraîchit le texte "il y a Xs" pendant que le panneau est ouvert.
  useEffect(() => {
    if (!ouvert) return;
    const id = setInterval(() => forceRender((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [ouvert]);

  async function baisser(id: string) {
    setMains((m) => m.filter((x) => x.id !== id));
    try {
      await fetch(`/api/mains-levees/${id}`, { method: "DELETE" });
    } catch {
      // Sans conséquence — la ligne réapparaîtra au prochain rafraîchissement si l'appel a échoué.
    }
  }

  async function toutBaisser() {
    setMains([]);
    try {
      await fetch("/api/mains-levees/tout-baisser", { method: "POST" });
    } catch {
      // Idem.
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-label={ouvert ? "Fermer la liste des mains levées" : "Voir les mains levées"}
        className={`fixed bottom-4 left-4 z-50 flex h-14 w-14 items-center justify-center rounded-full border-2 border-space-border bg-space-surface text-ink-primary transition-transform hover:scale-105 ${
          mains.length > 0 ? "animate-glow-pulse" : ""
        }`}
        style={{ boxShadow: "3px 3px 0 rgb(var(--arcade-shadow-clr))" }}
      >
        {ouvert ? <X className="h-6 w-6" /> : <Hand className="h-6 w-6" />}
        {!ouvert && mains.length > 0 && (
          <span
            className="absolute -right-1 -top-1 flex h-5 min-w-5 animate-pop-in items-center justify-center rounded-full px-1 text-[11px] font-bold text-white"
            style={{ background: "rgb(var(--arcade-nsi))" }}
          >
            {mains.length > 99 ? "99+" : mains.length}
          </span>
        )}
      </button>

      {ouvert && (
        <div
          className="fixed bottom-20 left-4 z-50 flex max-h-[70vh] w-80 flex-col overflow-hidden rounded-xl border-2 border-space-border bg-space-surface"
          style={{ boxShadow: "3px 3px 0 rgb(var(--arcade-shadow-clr))" }}
        >
          <div className="flex items-center justify-between border-b-2 border-space-border px-4 py-3">
            <p className="font-medium text-ink-primary">Mains levées</p>
            {mains.length > 0 && (
              <button
                type="button"
                onClick={toutBaisser}
                className="text-xs font-medium text-ink-muted underline hover:text-ink-primary"
              >
                Tout baisser
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {mains.length === 0 ? (
              <p className="p-3 text-sm text-ink-muted">Aucune main levée pour le moment.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {mains.map((main) => (
                  <li
                    key={main.id}
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm text-ink-secondary"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink-primary">
                        {main.prenom ? `${main.prenom} ${main.nom}` : main.nom}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {main.classeNom ? `${main.classeNom} · ` : ""}levée il y a {depuisTexte(main.depuis)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => baisser(main.id)}
                      className="shrink-0 rounded-lg border border-space-border px-2 py-1 text-xs font-medium text-ink-secondary transition-colors hover:bg-space-surface2 hover:text-ink-primary"
                    >
                      Baisser
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
