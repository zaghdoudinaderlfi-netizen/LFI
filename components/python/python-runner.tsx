"use client";

import { useEffect, useId, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { Maximize2, Minimize2 } from "lucide-react";

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

function formaterChrono(secondes: number): string {
  const m = Math.floor(secondes / 60);
  const s = secondes % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PythonRunner({
  codeInitial,
  onSoumettre,
  soumissionLabel = "Soumettre",
  antiTriche = false,
  finChrono,
}: {
  codeInitial: string;
  onSoumettre?: (code: string, sortie: string, capture: string | null) => Promise<ResultatSoumissionCode>;
  soumissionLabel?: string;
  /** Mode examen : bloque le copier-coller/clic-droit sur l'éditeur. */
  antiTriche?: boolean;
  /** Mode examen : compte à rebours partagé, soumission auto puis lecture seule à 0. */
  finChrono?: Date;
}) {
  const [code, setCode] = useState(codeInitial);
  const [sortie, setSortie] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [aDessin, setADessin] = useState(false);
  const [resultat, setResultat] = useState<ResultatSoumissionCode | null>(null);
  const turtleRef = useRef<HTMLDivElement>(null);
  const turtleId = `turtle-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  // Plein écran : superposition CSS plutôt que l'API Fullscreen du
  // navigateur, pour garder les styles de l'app et rester prévisible quand le
  // runner est imbriqué dans le formulaire d'exercice (le composant reste au
  // même endroit du DOM, la soumission continue de fonctionner).
  const [pleinEcran, setPleinEcran] = useState(false);

  const [tempsRestant, setTempsRestant] = useState<number | null>(
    finChrono ? Math.max(0, Math.round((finChrono.getTime() - Date.now()) / 1000)) : null
  );
  const tempsEcoule = finChrono ? (tempsRestant ?? 0) <= 0 : false;
  const autoSoumisRef = useRef(false);

  // Échap pour sortir, et on fige le défilement de la page derrière
  // la superposition tant qu'elle est ouverte.
  useEffect(() => {
    if (!pleinEcran) return;

    function surTouche(e: KeyboardEvent) {
      if (e.key === "Escape") setPleinEcran(false);
    }

    const overflowInitial = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", surTouche);

    return () => {
      document.body.style.overflow = overflowInitial;
      document.removeEventListener("keydown", surTouche);
    };
  }, [pleinEcran]);

  useEffect(() => {
    if (!finChrono) return;

    const id = setInterval(() => {
      setTempsRestant(Math.max(0, Math.round((finChrono.getTime() - Date.now()) / 1000)));
    }, 1000);

    return () => clearInterval(id);
  }, [finChrono]);

  useEffect(() => {
    if (!tempsEcoule || autoSoumisRef.current || !onSoumettre) return;
    autoSoumisRef.current = true;
    gererSoumettre();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempsEcoule]);

  function bloquerCopierColler(e: React.ClipboardEvent | React.MouseEvent) {
    if (antiTriche) e.preventDefault();
  }

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
    <div
      className={
        pleinEcran
          ? "fixed inset-0 z-50 flex flex-col gap-3 bg-space-deep p-4 sm:p-6"
          : "flex flex-col gap-3"
      }
    >
      {finChrono && (
        <p
          className={`self-start rounded-lg px-3 py-1 text-sm font-bold ${
            tempsEcoule
              ? "bg-red-500/10 text-red-400"
              : (tempsRestant ?? 0) < 60
                ? "bg-amber-500/10 text-amber-400"
                : "bg-space-surface2 text-ink-primary"
          }`}
        >
          ⏱ {tempsEcoule ? "Temps écoulé" : formaterChrono(tempsRestant ?? 0)}
        </p>
      )}

      <div
        // En plein écran, `[&>div]:h-full` étire le conteneur que génère
        // react-codemirror : sans lui, `height="100%"` ne se résout pas
        // jusqu'à la zone de saisie, qui reste haute de quelques lignes.
        className={`overflow-hidden rounded-xl border border-space-border ${
          pleinEcran ? "min-h-0 flex-1 [&>div]:h-full" : ""
        }`}
        onCopy={bloquerCopierColler}
        onCut={bloquerCopierColler}
        onPaste={bloquerCopierColler}
        onContextMenu={bloquerCopierColler}
      >
        <CodeMirror
          value={code}
          // En plein écran, l'éditeur remplit ce que les boutons et la sortie
          // laissent (conteneur flex-1), au lieu d'une hauteur calculée.
          height={pleinEcran ? "100%" : "220px"}
          extensions={[python()]}
          onChange={setCode}
          basicSetup={{ tabSize: 4 }}
          style={{ fontSize: 13 }}
          editable={!tempsEcoule}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={gererExecuter} disabled={enCours || tempsEcoule} className="btn-secondary">
          ▶ {enCours ? "Exécution..." : "Exécuter"}
        </button>

        {onSoumettre && (
          <button
            type="button"
            onClick={gererSoumettre}
            disabled={enCours || tempsEcoule}
            className="btn border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
          >
            {enCours ? "..." : soumissionLabel}
          </button>
        )}

        <button
          type="button"
          onClick={() => setPleinEcran((v) => !v)}
          className="btn-secondary ml-auto gap-2"
          title={pleinEcran ? "Quitter le plein écran (Échap)" : "Afficher le code en plein écran"}
          aria-pressed={pleinEcran}
        >
          {pleinEcran ? (
            <>
              <Minimize2 className="h-4 w-4" />
              Quitter le plein écran
            </>
          ) : (
            <>
              <Maximize2 className="h-4 w-4" />
              Plein écran
            </>
          )}
        </button>
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
