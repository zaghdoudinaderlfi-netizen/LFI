"use client";

import { useActionState } from "react";
import { ChampFormulaire, formaterLabelChamp, PREFIXE_CHAMP_FORMULAIRE } from "@/lib/formulaire-champs";
import { soumettreFormulaireAction } from "./formulaire-actions";

export function FormulaireForm({
  exerciceId,
  slug,
  champs,
  reponses,
}: {
  exerciceId: string;
  slug: string;
  champs: ChampFormulaire[];
  reponses: Record<string, string | boolean>;
}) {
  const [message, formAction, isPending] = useActionState(soumettreFormulaireAction, undefined);
  const envoye = message === "Formulaire envoyé.";

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-md border border-slate-200 p-3">
      <input type="hidden" name="exerciceId" value={exerciceId} />
      <input type="hidden" name="slug" value={slug} />

      {champs.map((champ) => {
        const nomChamp = `${PREFIXE_CHAMP_FORMULAIRE}${champ.nom}`;
        const label = formaterLabelChamp(champ.nom);
        const valeur = reponses[champ.nom] ?? champ.valeur;

        if (champ.type === "texte") {
          return (
            <div key={champ.nom} className="flex flex-col gap-1">
              <label htmlFor={nomChamp} className="text-sm font-medium text-slate-700">
                {label}
              </label>
              {champ.multiligne ? (
                <textarea
                  id={nomChamp}
                  name={nomChamp}
                  rows={4}
                  defaultValue={typeof valeur === "string" ? valeur : ""}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              ) : (
                <input
                  id={nomChamp}
                  name={nomChamp}
                  type="text"
                  defaultValue={typeof valeur === "string" ? valeur : ""}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              )}
            </div>
          );
        }

        if (champ.type === "case") {
          return (
            <label key={champ.nom} className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                id={nomChamp}
                name={nomChamp}
                type="checkbox"
                defaultChecked={typeof valeur === "boolean" ? valeur : false}
                className="h-4 w-4 rounded border-slate-300"
              />
              {label}
            </label>
          );
        }

        return (
          <div key={champ.nom} className="flex flex-col gap-1">
            <label htmlFor={nomChamp} className="text-sm font-medium text-slate-700">
              {label}
            </label>
            <select
              id={nomChamp}
              name={nomChamp}
              defaultValue={typeof valeur === "string" ? valeur : ""}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <option value="">—</option>
              {champ.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );
      })}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {isPending ? "Envoi..." : "Envoyer mes réponses"}
      </button>

      {message && (
        <p className={`text-sm ${envoye ? "text-green-600" : "text-red-600"}`} role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
