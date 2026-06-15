"use client";

import { useId, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";

const SKULPT_BASE = "https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist";

type SkulptGlobal = {
  configure: (options: Record<string, unknown>) => void;
  python3: unknown;
  builtinFiles?: { files: Record<string, string> };
  TurtleGraphics?: { target: string; width: number; height: number };
  misceval: { asyncToPromise: (fn: () => unknown) => Promise<unknown> };
  importMainWithBody: (name: string, dumpJs: boolean, code: string, canSuspend: boolean) => unknown;
};

declare global {
  interface Window {
    Sk?: SkulptGlobal;
  }
}

// Skulpt n'est pas un module ES (il expose un global `Sk` et lit ses fichiers
// stdlib via XHR) : on le charge à la demande via deux <script> CDN, une seule
// fois pour toute la page, uniquement au premier clic sur "Exécuter".
let skulptPromise: Promise<void> | null = null;

function chargerScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Impossible de charger l'environnement Python (Skulpt)."));
    document.body.appendChild(script);
  });
}

function chargerSkulpt(): Promise<void> {
  if (window.Sk?.builtinFiles) return Promise.resolve();
  if (!skulptPromise) {
    skulptPromise = chargerScript(`${SKULPT_BASE}/skulpt.min.js`).then(() =>
      chargerScript(`${SKULPT_BASE}/skulpt-stdlib.js`)
    );
  }
  return skulptPromise;
}

export type ResultatSoumissionCode = {
  reussi: boolean | null;
  message: string;
  erreur?: boolean;
};

export function PythonRunner({
  codeInitial,
  onSoumettre,
  soumissionLabel = "Soumettre",
}: {
  codeInitial: string;
  onSoumettre?: (code: string, sortie: string, capture: string | null) => Promise<ResultatSoumissionCode>;
  soumissionLabel?: string;
}) {
  const [code, setCode] = useState(codeInitial);
  const [sortie, setSortie] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [aDessin, setADessin] = useState(false);
  const [resultat, setResultat] = useState<ResultatSoumissionCode | null>(null);
  const turtleRef = useRef<HTMLDivElement>(null);
  const turtleId = `turtle-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  async function executer(): Promise<{ sortie: string; capture: string | null }> {
    setErreur(null);
    setSortie("");
    setADessin(false);
    if (turtleRef.current) turtleRef.current.innerHTML = "";

    let texte = "";

    try {
      await chargerSkulpt();
      const Sk = window.Sk!;

      Sk.configure({
        output: (s: string) => {
          texte += s;
          setSortie((o) => o + s);
        },
        read: (nomFichier: string) => {
          if (!Sk.builtinFiles?.files[nomFichier]) {
            throw new Error(`Fichier introuvable : ${nomFichier}`);
          }
          return Sk.builtinFiles.files[nomFichier];
        },
        inputfun: (invite: string) => window.prompt(invite) ?? "",
        inputfunTakesPrompt: true,
        __future__: Sk.python3,
        // Évite de bloquer l'onglet si l'élève écrit une boucle infinie.
        execLimit: 10000,
      });

      Sk.TurtleGraphics = { target: turtleId, width: 400, height: 400 };

      await Sk.misceval.asyncToPromise(() => Sk.importMainWithBody("<stdin>", false, code, true));
    } catch (err) {
      setErreur(String(err));
    } finally {
      setADessin((turtleRef.current?.childElementCount ?? 0) > 0);
    }

    let capture: string | null = null;
    const canvas = turtleRef.current?.querySelector("canvas");
    if (canvas) {
      try {
        capture = canvas.toDataURL("image/png");
      } catch {
        capture = null;
      }
    }

    return { sortie: texte, capture };
  }

  async function gererExecuter() {
    setEnCours(true);
    setResultat(null);
    await executer();
    setEnCours(false);
  }

  async function gererSoumettre() {
    if (!onSoumettre) return;
    setEnCours(true);
    setResultat(null);
    const { sortie: texte, capture } = await executer();
    try {
      setResultat(await onSoumettre(code, texte, capture));
    } catch {
      setResultat({ reussi: null, message: "Échec de l'envoi de la soumission.", erreur: true });
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-xl border border-space-border">
        <CodeMirror
          value={code}
          height="220px"
          extensions={[python()]}
          onChange={setCode}
          basicSetup={{ tabSize: 4 }}
          style={{ fontSize: 13 }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={gererExecuter} disabled={enCours} className="btn-secondary">
          ▶ {enCours ? "Exécution..." : "Exécuter"}
        </button>

        {onSoumettre && (
          <button
            type="button"
            onClick={gererSoumettre}
            disabled={enCours}
            className="btn border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
          >
            {enCours ? "..." : soumissionLabel}
          </button>
        )}
      </div>

      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-muted">Sortie</p>
        <pre className="min-h-[3rem] max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-space-border bg-space-deep p-3 text-xs text-emerald-300">
          {sortie || (enCours ? "..." : "(aucune sortie)")}
        </pre>
        {erreur && <p className="mt-1 whitespace-pre-wrap break-words text-xs text-red-400">{erreur}</p>}
      </div>

      <div className={aDessin ? "flex flex-col gap-1" : "hidden"}>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Dessin (turtle)</p>
        <div
          ref={turtleRef}
          id={turtleId}
          className="relative mx-auto aspect-square w-full max-w-[400px] overflow-hidden rounded-xl border border-space-border bg-white [&>canvas]:!absolute [&>canvas]:!inset-0 [&>canvas]:!m-0 [&>canvas]:h-full [&>canvas]:w-full"
        />
      </div>

      {resultat && (
        <p
          className={`text-sm ${
            resultat.erreur
              ? "text-red-400"
              : resultat.reussi === true
                ? "text-emerald-400"
                : resultat.reussi === false
                  ? "text-amber-400"
                  : "text-ink-secondary"
          }`}
          role="alert"
        >
          {resultat.message}
        </p>
      )}
    </div>
  );
}
