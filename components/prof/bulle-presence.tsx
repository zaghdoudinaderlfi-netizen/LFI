"use client";

import { useEffect, useState } from "react";
import { Users, X } from "lucide-react";
import type { ClasseAvecPresence } from "@/lib/presence";

const INTERVALLE_MS = 10_000;

function Point({ enLigne }: { enLigne: boolean }) {
  return (
    <span
      className={`h-2.5 w-2.5 shrink-0 rounded-full ${enLigne ? "bg-emerald-500" : "bg-red-400"}`}
      aria-label={enLigne ? "Connecté" : "Déconnecté"}
      title={enLigne ? "Connecté" : "Déconnecté"}
    />
  );
}

/**
 * Bulle flottante façon Messenger : au clic, affiche la liste des élèves de
 * chaque classe avec un point de connexion (voir lib/presence.ts pour le
 * calcul en ligne/hors ligne). Se rafraîchit uniquement pendant que le
 * panneau est ouvert.
 */
export function BullePresence() {
  const [ouvert, setOuvert] = useState(false);
  const [classes, setClasses] = useState<ClasseAvecPresence[] | null>(null);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    if (!ouvert) return;

    let annule = false;

    const rafraichir = async () => {
      try {
        const res = await fetch("/api/presence/eleves", { cache: "no-store" });
        if (!res.ok || annule) return;
        const donnees: ClasseAvecPresence[] = await res.json();
        if (!annule) {
          setClasses(donnees);
          setErreur(false);
        }
      } catch {
        if (!annule) setErreur(true);
      }
    };

    rafraichir();
    const id = setInterval(rafraichir, INTERVALLE_MS);
    return () => {
      annule = true;
      clearInterval(id);
    };
  }, [ouvert]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-label={ouvert ? "Fermer la liste des élèves connectés" : "Voir les élèves connectés"}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full border-2 border-space-border bg-space-surface text-ink-primary transition-transform hover:scale-105"
        style={{ boxShadow: "3px 3px 0 rgb(var(--arcade-shadow-clr))" }}
      >
        {ouvert ? <X className="h-6 w-6" /> : <Users className="h-6 w-6" />}
      </button>

      {ouvert && (
        <div
          className="fixed bottom-20 right-4 z-50 flex max-h-[70vh] w-80 flex-col overflow-hidden rounded-xl border-2 border-space-border bg-space-surface"
          style={{ boxShadow: "3px 3px 0 rgb(var(--arcade-shadow-clr))" }}
        >
          <div className="border-b-2 border-space-border px-4 py-3">
            <p className="font-medium text-ink-primary">Élèves connectés</p>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {erreur && !classes && (
              <p className="p-3 text-sm text-ink-muted">Impossible de charger la liste.</p>
            )}

            {!erreur && !classes && (
              <p className="p-3 text-sm text-ink-muted">Chargement...</p>
            )}

            {classes && classes.length === 0 && (
              <p className="p-3 text-sm text-ink-muted">Aucune classe pour le moment.</p>
            )}

            {classes?.map((classe) => (
              <div key={classe.id} className="mb-2 last:mb-0">
                <p className="px-2 py-1 text-xs font-bold uppercase tracking-wide text-ink-muted">
                  {classe.nom}
                </p>
                {classe.eleves.length === 0 ? (
                  <p className="px-2 py-1 text-sm text-ink-muted">Aucun élève.</p>
                ) : (
                  <ul className="flex flex-col">
                    {classe.eleves.map((eleve) => (
                      <li
                        key={eleve.id}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink-secondary"
                      >
                        <Point enLigne={eleve.enLigne} />
                        <span className="truncate">
                          {eleve.prenom ? `${eleve.prenom} ${eleve.nom}` : eleve.nom}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
