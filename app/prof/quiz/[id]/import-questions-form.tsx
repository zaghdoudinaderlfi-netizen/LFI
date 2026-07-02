"use client";

import { useRef, useState, useTransition } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import type { ResultatImportCSV } from "@/lib/quiz";
import { previewImportQuestionsAction, confirmerImportQuestionsAction } from "./questions-actions";

const EXEMPLE =
  "Quelle instruction affiche du texte en Python ?;print();input();exec();return();1;20";

export function ImportQuestionsForm({ quizId }: { quizId: string }) {
  const [texte, setTexte] = useState("");
  const [apercu, setApercu] = useState<ResultatImportCSV | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    fichier.text().then((contenu) => {
      setTexte(contenu);
      setApercu(null);
      setMessage(null);
    });
  }

  function handleApercu() {
    setMessage(null);
    startTransition(async () => {
      const resultat = await previewImportQuestionsAction(texte);
      setApercu(resultat);
    });
  }

  function handleConfirmer() {
    if (!apercu || apercu.valides.length === 0) return;
    startTransition(async () => {
      const resultat = await confirmerImportQuestionsAction(quizId, apercu.valides);
      setMessage(resultat);
      setApercu(null);
      setTexte("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-space-border bg-space-surface2/60 p-4">
      <div>
        <p className="text-sm font-medium text-ink-primary">Import par fichier ou texte</p>
        <p className="mt-1 text-xs text-ink-muted">
          Une ligne = une question, au format :{" "}
          <code className="text-neon-cyan">question;choixA;choixB;choixC;choixD;bonneReponse;tempsEnSecondes</code>
          <br />
          <code className="text-ink-secondary">bonneReponse</code> : 1, 2, 3 ou 4 (A, B, C ou D) ·{" "}
          <code className="text-ink-secondary">tempsEnSecondes</code> : optionnel, 20 par défaut.
          <br />
          Exemple : <code className="text-ink-muted">{EXEMPLE}</code>
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt"
        onChange={handleFichier}
        className="input file:mr-3 file:rounded file:border-0 file:bg-space-surface file:px-3 file:py-1 file:text-sm file:text-ink-primary"
      />

      <textarea
        id="import-questions-texte"
        aria-label="Questions au format texte/CSV"
        value={texte}
        onChange={(e) => {
          setTexte(e.target.value);
          setApercu(null);
          setMessage(null);
        }}
        rows={5}
        placeholder={EXEMPLE}
        className="input font-mono text-xs"
      />

      <button
        type="button"
        onClick={handleApercu}
        disabled={isPending || !texte.trim()}
        className="btn-secondary self-start"
      >
        {isPending && !apercu ? "Analyse..." : "Aperçu"}
      </button>

      {apercu && (
        <div className="flex flex-col gap-3">
          {apercu.valides.length > 0 && (
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                {apercu.valides.length} question{apercu.valides.length > 1 ? "s" : ""} valide
                {apercu.valides.length > 1 ? "s" : ""}
              </p>
              <ul className="flex flex-col gap-1">
                {apercu.valides.map((l) => (
                  <li
                    key={l.ligne}
                    className="truncate rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-xs text-ink-secondary"
                  >
                    L{l.ligne} · {l.enonce}{" "}
                    <span className="text-emerald-400">
                      (bonne réponse : {["A", "B", "C", "D"][l.bonneReponse]})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {apercu.invalides.length > 0 && (
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-red-400">
                <XCircle className="h-4 w-4" />
                {apercu.invalides.length} ligne{apercu.invalides.length > 1 ? "s" : ""} invalide
                {apercu.invalides.length > 1 ? "s" : ""} (ignorée{apercu.invalides.length > 1 ? "s" : ""})
              </p>
              <ul className="flex flex-col gap-1">
                {apercu.invalides.map((l) => (
                  <li
                    key={l.ligne}
                    className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs text-ink-secondary"
                  >
                    <span className="font-medium text-red-300">L{l.ligne}</span> · {l.raison}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={handleConfirmer}
            disabled={isPending || apercu.valides.length === 0}
            className="btn-primary self-start"
          >
            {isPending
              ? "Import..."
              : `Importer ${apercu.valides.length} question${apercu.valides.length > 1 ? "s" : ""} valide${apercu.valides.length > 1 ? "s" : ""}`}
          </button>
        </div>
      )}

      {message && (
        <p className="text-sm text-emerald-400" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
