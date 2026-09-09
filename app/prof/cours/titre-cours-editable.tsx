"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useToast } from "@/components/ui/toast";
import { renommerCoursAction } from "./actions";

/**
 * Titre de cours éditable au clic, directement dans la liste du dashboard.
 * Le `<li>` parent (voir CoursTriables) porte `draggable` pour le glisser-
 * déposer natif de réordonnancement — un `<button>` imbriqué n'amorce pas ce
 * glisser (comportement natif des éléments interactifs), donc pas de conflit.
 */
export function TitreCoursEditable({ coursId, titre }: { coursId: string; titre: string }) {
  const [enEdition, setEnEdition] = useState(false);
  const [valeur, setValeur] = useState(titre);
  const [titreAffiche, setTitreAffiche] = useState(titre);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  // Le cours peut être renommé ailleurs (page d'édition) pendant que ce
  // composant garde son état local.
  useEffect(() => {
    setTitreAffiche(titre);
  }, [titre]);

  useEffect(() => {
    if (enEdition) inputRef.current?.select();
  }, [enEdition]);

  function ouvrirEdition() {
    setValeur(titreAffiche);
    setEnEdition(true);
  }

  function annuler() {
    setEnEdition(false);
    setValeur(titreAffiche);
  }

  function valider() {
    const nouveauTitre = valeur.trim();
    setEnEdition(false);

    if (!nouveauTitre || nouveauTitre === titreAffiche) {
      setValeur(titreAffiche);
      return;
    }

    const ancien = titreAffiche;
    setTitreAffiche(nouveauTitre);

    startTransition(async () => {
      const res = await renommerCoursAction(coursId, nouveauTitre);
      if (!res.ok) {
        setTitreAffiche(ancien);
        setValeur(ancien);
        addToast({ type: "error", message: res.erreur ?? "Erreur inconnue." });
      }
    });
  }

  if (enEdition) {
    return (
      <input
        ref={inputRef}
        type="text"
        aria-label="Titre du cours"
        value={valeur}
        onChange={(e) => setValeur(e.target.value)}
        onBlur={valider}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            valider();
          } else if (e.key === "Escape") {
            e.preventDefault();
            annuler();
          }
        }}
        disabled={isPending}
        className="input w-full py-1 font-medium text-ink-primary"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={ouvrirEdition}
      title="Cliquer pour renommer le cours"
      className="w-full truncate text-left font-medium text-ink-primary decoration-dotted underline-offset-4 hover:underline"
    >
      {titreAffiche}
    </button>
  );
}
