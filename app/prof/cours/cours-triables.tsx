"use client";

import { useState, useTransition, type ReactNode } from "react";
import { GripVertical } from "lucide-react";
import { reordonnerCoursAction } from "./actions";

export type CoursTriable = { id: string; contenu: ReactNode };

/**
 * Liste de cours réordonnable à la souris, à l'intérieur d'un chapitre.
 *
 * Le contenu de chaque carte est rendu côté serveur et passé ici en
 * `ReactNode` : ce composant ne s'occupe que de l'ordre, pas de l'affichage,
 * pour que les toggles et les boutons de la carte restent inchangés.
 *
 * L'ordre est appliqué localement dès le dépôt (pas d'attente serveur), puis
 * envoyé à reordonnerCoursAction. La poignée est aussi utilisable au clavier
 * (flèches haut/bas) — le glisser-déposer HTML5 ne répond ni au clavier ni au
 * tactile.
 */
export function CoursTriables({ items }: { items: CoursTriable[] }) {
  const [ordre, setOrdre] = useState(items);
  const [attrapeId, setAttrapeId] = useState<string | null>(null);
  const [surviseId, setSurviseId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Les cartes peuvent changer côté serveur (publication, suppression) pendant
  // que ce composant garde son état : on se resynchronise quand la liste reçue
  // ne décrit plus les mêmes cours.
  const idsRecus = items.map((i) => i.id).join(",");
  const [idsConnus, setIdsConnus] = useState(idsRecus);
  if (idsRecus !== idsConnus) {
    setIdsConnus(idsRecus);
    setOrdre(items);
  }

  function deplacer(depuis: number, vers: number) {
    if (vers < 0 || vers >= ordre.length || depuis === vers) return;
    const suivant = [...ordre];
    const [attrape] = suivant.splice(depuis, 1);
    suivant.splice(vers, 0, attrape);
    setOrdre(suivant);
    startTransition(() => reordonnerCoursAction(suivant.map((i) => i.id)));
  }

  return (
    <ul className="flex flex-col gap-3">
      {ordre.map((item, index) => (
        <li
          key={item.id}
          draggable
          onDragStart={(e) => {
            setAttrapeId(item.id);
            e.dataTransfer.effectAllowed = "move";
            // Firefox n'amorce pas le glisser sans données transférées.
            e.dataTransfer.setData("text/plain", item.id);
          }}
          onDragEnd={() => {
            setAttrapeId(null);
            setSurviseId(null);
          }}
          onDragOver={(e) => {
            if (!attrapeId || attrapeId === item.id) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            setSurviseId(item.id);
          }}
          onDragLeave={() => setSurviseId((id) => (id === item.id ? null : id))}
          onDrop={(e) => {
            e.preventDefault();
            setSurviseId(null);
            if (!attrapeId) return;
            const depuis = ordre.findIndex((i) => i.id === attrapeId);
            if (depuis !== -1) deplacer(depuis, index);
            setAttrapeId(null);
          }}
          className={`flex items-start gap-2 rounded-xl border bg-space-surface2/60 p-4 transition ${
            attrapeId === item.id
              ? "border-neon-violet/60 opacity-50"
              : surviseId === item.id
                ? "border-neon-cyan/70 ring-1 ring-neon-cyan/40"
                : "border-space-border"
          }`}
        >
          <button
            type="button"
            aria-label={`Déplacer — position ${index + 1} sur ${ordre.length}. Flèches haut et bas pour changer l'ordre.`}
            title="Glisser pour réordonner (ou flèches haut/bas)"
            onKeyDown={(e) => {
              if (e.key === "ArrowUp") {
                e.preventDefault();
                deplacer(index, index - 1);
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                deplacer(index, index + 1);
              }
            }}
            className="mt-0.5 shrink-0 cursor-grab rounded-md p-1 text-ink-muted hover:bg-space-border/50 hover:text-ink-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan active:cursor-grabbing"
          >
            <GripVertical className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {item.contenu}
          </div>
        </li>
      ))}
    </ul>
  );
}
