"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import type { Matiere, Niveau, TypeCoursSimple } from "@prisma/client";
import {
  Upload,
  FileCode2,
  FileType2,
  FileText,
  PlayCircle,
  HelpCircle,
  CheckCircle2,
  Inbox,
  Eye,
  Lock,
  CalendarClock,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Switch } from "@/components/ui/switch";
import { NIVEAU_LABELS, MATIERE_LABELS } from "@/lib/classes-constants";

type CoursFormValues = {
  id?: string;
  titre: string;
  niveau: Niveau;
  matiere: Matiere;
  publie: boolean;
  chapitre?: number | null;
};

type QuizDisponible = {
  id: string;
  titre: string;
  niveau: Niveau;
  matiere: Matiere;
};

const TYPES_COURS: { value: TypeCoursSimple; Icone: typeof FileCode2; label: string; accent: string }[] = [
  { value: "HTML", Icone: FileCode2, label: "HTML", accent: "violet" },
  { value: "PDF", Icone: FileType2, label: "PDF", accent: "amber" },
  { value: "WORD", Icone: FileText, label: "Word", accent: "blue" },
  { value: "VIDEO", Icone: PlayCircle, label: "Vidéo", accent: "pink" },
  { value: "QCM", Icone: HelpCircle, label: "QCM", accent: "cyan" },
];

const ACCENT_CLASSES: Record<string, { actif: string; icone: string }> = {
  violet: { actif: "!border-violet-500/40 !bg-violet-500/10 !text-violet-600 dark:!text-violet-300", icone: "text-violet-500" },
  amber: { actif: "!border-amber-500/40 !bg-amber-500/10 !text-amber-600 dark:!text-amber-300", icone: "text-amber-500" },
  blue: { actif: "!border-neon-blue/40 !bg-neon-blue/10 !text-neon-blue", icone: "text-neon-blue" },
  pink: { actif: "!border-pink-500/40 !bg-pink-500/10 !text-pink-600 dark:!text-pink-300", icone: "text-pink-500" },
  cyan: { actif: "!border-neon-cyan/40 !bg-neon-cyan/10 !text-neon-cyan", icone: "text-neon-cyan" },
};

const ACCEPT_PAR_TYPE: Record<"HTML" | "PDF" | "WORD", string> = {
  HTML: ".html,.htm",
  PDF: ".pdf",
  WORD: ".docx",
};

const LABEL_FICHIER_PAR_TYPE: Record<"HTML" | "PDF" | "WORD", string> = {
  HTML: "Fichier HTML (.html)",
  PDF: "Fichier PDF (.pdf)",
  WORD: "Fichier Word (.docx)",
};

export function CoursForm({
  action,
  cours,
  submitLabel,
  quizzesDisponibles = [],
}: {
  action: (
    prevState: string | undefined,
    formData: FormData
  ) => Promise<string | undefined>;
  cours?: CoursFormValues;
  submitLabel: string;
  quizzesDisponibles?: QuizDisponible[];
}) {
  const [message, formAction, isPending] = useActionState(action, undefined);
  const enregistre = message === "Cours enregistré.";
  const [publie, setPublie] = useState(cours?.publie ?? false);
  const [typeSimple, setTypeSimple] = useState<TypeCoursSimple | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [depotActif, setDepotActif] = useState(false);
  const [correctionActif, setCorrectionActif] = useState(false);
  const fichierRef = useRef<HTMLInputElement>(null);
  const publieRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  function choisirType(valeur: TypeCoursSimple) {
    setTypeSimple((cur) => (cur === valeur ? null : valeur));
    setFileName(null);
    setDepotActif(false);
    setCorrectionActif(false);
    if (fichierRef.current) fichierRef.current.value = "";
  }

  function deposerFichier(fichier: File | null | undefined) {
    if (!fichier) return;
    setFileName(fichier.name);
  }

  function changerFichier() {
    setFileName(null);
    if (fichierRef.current) fichierRef.current.value = "";
  }

  useEffect(() => {
    if (!message) return;
    if (enregistre) {
      addToast({
        type: "success",
        message: publie ? "Cours enregistré et publié !" : "Cours enregistré (brouillon).",
      });
    } else {
      addToast({ type: "error", message });
    }
  }, [message, enregistre, publie, addToast]);

  return (
    <form action={formAction} className="flex flex-col gap-4" encType="multipart/form-data">
      {cours?.id && <input type="hidden" name="id" value={cours.id} />}

      {!cours?.id && (
        <p className="rounded-lg border border-space-border bg-space-surface2/60 p-3 text-sm text-ink-secondary">
          Choisis un format ci-dessous, ou laisse la sélection vide pour créer un cours{" "}
          <strong className="text-ink-primary">vierge</strong> et composer le contenu (blocs texte/image/vidéo,
          import Word ou PDF, cours interactif HTML…) depuis la page d&apos;édition.
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="titre" className="field-label">
          Titre
        </label>
        <input
          id="titre"
          name="titre"
          type="text"
          required
          defaultValue={cours?.titre}
          placeholder="ex. Les réseaux informatiques"
          className="input"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="chapitre" className="field-label">
          Chapitre <span className="text-ink-muted font-normal">(numéro, optionnel)</span>
        </label>
        <input
          id="chapitre"
          name="chapitre"
          type="number"
          min={1}
          step={1}
          defaultValue={cours?.chapitre ?? ""}
          placeholder="ex. 1"
          className="input w-28"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="niveau" className="field-label">
            Niveau
          </label>
          <select
            id="niveau"
            name="niveau"
            required
            defaultValue={cours?.niveau ?? "TROISIEME"}
            className="input"
          >
            <option value="TROISIEME">3ème</option>
            <option value="SECONDE">2nde</option>
            <option value="PREMIERE">1ère</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="matiere" className="field-label">
            Matière
          </label>
          <select
            id="matiere"
            name="matiere"
            required
            defaultValue={cours?.matiere ?? "TECHNOLOGIE"}
            className="input"
          >
            <option value="TECHNOLOGIE">Technologie</option>
            <option value="SNT">SNT</option>
            <option value="NSI">NSI</option>
          </select>
        </div>
      </div>

      {!cours?.id && (
        <div className="flex flex-col gap-1">
          <label htmlFor="imageCouverture" className="field-label">
            Image de couverture <span className="text-ink-muted font-normal">(optionnel)</span>
          </label>
          <input
            id="imageCouverture"
            name="imageCouverture"
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            className="input file:mr-3 file:rounded file:border-0 file:bg-space-surface file:px-3 file:py-1 file:text-sm file:text-ink-primary"
          />
          <p className="text-xs text-ink-muted">
            PNG, JPG, WebP — 5 Mo max. Affichée en vignette dans la liste des cours élève.
          </p>
        </div>
      )}

      {!cours?.id && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="field-label">Contenu du cours — optionnel</span>
            <div className="flex flex-wrap gap-2">
              {TYPES_COURS.map((t) => {
                const actif = typeSimple === t.value;
                const accent = ACCENT_CLASSES[t.accent];
                return (
                  <button
                    key={t.value}
                    type="button"
                    aria-pressed={actif}
                    onClick={() => choisirType(t.value)}
                    className={`btn-secondary gap-1.5 ${actif ? accent.actif : ""}`}
                  >
                    <t.Icone className={`h-4 w-4 ${actif ? "" : accent.icone}`} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
          <input type="hidden" name="type" value={typeSimple ?? ""} />

          {(typeSimple === "HTML" || typeSimple === "PDF" || typeSimple === "WORD") && (
            <div className="flex flex-col gap-2">
              {!fileName ? (
                <label
                  htmlFor="fichier"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const fichier = e.dataTransfer.files?.[0];
                    if (fichier && fichierRef.current) {
                      const dt = new DataTransfer();
                      dt.items.add(fichier);
                      fichierRef.current.files = dt.files;
                      deposerFichier(fichier);
                    }
                  }}
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-space-borderlight bg-space-surface2/40 px-6 py-8 text-center transition-colors hover:border-neon-blue/50 hover:bg-space-surface2/70"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-neon-blue/10 text-neon-blue">
                    <Upload className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold text-ink-primary">Dépose ton fichier ici</span>
                  <span className="text-xs text-ink-secondary">
                    ou clique pour parcourir — {LABEL_FICHIER_PAR_TYPE[typeSimple]}, 20 Mo max
                  </span>
                </label>
              ) : (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-space-border bg-space-surface2/50 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-space-surface ${ACCENT_CLASSES[TYPES_COURS.find((t) => t.value === typeSimple)!.accent].icone}`}>
                      {(() => {
                        const Icone = TYPES_COURS.find((t) => t.value === typeSimple)!.Icone;
                        return <Icone className="h-5 w-5" />;
                      })()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-primary">{fileName}</p>
                      <p className="flex items-center gap-1 text-xs font-medium text-emerald-500">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Fichier prêt
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={changerFichier} className="shrink-0 text-xs font-semibold text-ink-secondary hover:text-ink-primary">
                    Changer
                  </button>
                </div>
              )}
              <input
                ref={fichierRef}
                id="fichier"
                name="fichier"
                type="file"
                required
                accept={ACCEPT_PAR_TYPE[typeSimple]}
                onChange={(e) => deposerFichier(e.target.files?.[0])}
                className="sr-only"
              />
            </div>
          )}

          {typeSimple === "HTML" && (
            <div className="flex flex-col gap-3 rounded-xl border border-space-border bg-space-surface2/40 p-4">
              <span className="field-label">Options</span>

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
                    <Eye className="h-4 w-4" />
                  </span>
                  <span className="text-sm text-ink-secondary">
                    <span className="font-medium text-ink-primary">Correction visible aux élèves</span>
                    <span className="mt-0.5 block text-xs">
                      Tant que c&apos;est désactivé, les corrections ne sont jamais envoyées au navigateur de
                      l&apos;élève.
                    </span>
                  </span>
                </div>
                <Switch
                  checked={correctionActif}
                  onChange={() => setCorrectionActif((v) => !v)}
                  label="Correction visible aux élèves"
                />
                <input type="hidden" name="correctionVisible" value={correctionActif ? "on" : ""} />
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                    <Inbox className="h-4 w-4" />
                  </span>
                  <span className="text-sm text-ink-secondary">
                    <span className="font-medium text-ink-primary">Dépôt de compte-rendu</span>
                    <span className="mt-0.5 block text-xs">
                      Les élèves pourront déposer leur travail directement depuis la page du cours.
                    </span>
                  </span>
                </div>
                <Switch
                  checked={depotActif}
                  onChange={() => setDepotActif((v) => !v)}
                  label="Dépôt de compte-rendu activé"
                />
                <input type="hidden" name="depotActive" value={depotActif ? "on" : ""} />
              </div>

              {depotActif && (
                <div className="flex items-center gap-2 pl-[42px]">
                  <CalendarClock className="h-3.5 w-3.5 text-ink-muted" />
                  <label htmlFor="dateLimiteDepot" className="text-xs font-medium text-ink-secondary">
                    Date limite <span className="font-normal text-ink-muted">(optionnelle)</span>
                  </label>
                  <input
                    id="dateLimiteDepot"
                    name="dateLimiteDepot"
                    type="date"
                    className="input w-auto py-1 text-xs"
                  />
                </div>
              )}
            </div>
          )}

          {(typeSimple === "PDF" || typeSimple === "WORD" || typeSimple === "VIDEO") && (
            <p className="flex items-center gap-1.5 text-xs text-ink-muted">
              <Lock className="h-3.5 w-3.5" />
              Dépôt de compte-rendu et correction ne sont pas disponibles pour ce type de fichier.
            </p>
          )}

          {typeSimple === "VIDEO" && (
            <div className="flex flex-col gap-1">
              <label htmlFor="videoUrl" className="field-label">
                Colle le lien YouTube ou Vimeo
              </label>
              <input
                id="videoUrl"
                name="videoUrl"
                type="url"
                required
                placeholder="https://www.youtube.com/watch?v=..."
                className="input"
              />
            </div>
          )}

          {typeSimple === "QCM" && (
            <div className="flex flex-col gap-1">
              <label htmlFor="quizId" className="field-label">
                Quiz existant
              </label>
              {quizzesDisponibles.length > 0 ? (
                <select id="quizId" name="quizId" required defaultValue="" className="input">
                  <option value="" disabled>
                    — Choisir un quiz —
                  </option>
                  {quizzesDisponibles.map((q) => (
                    <option key={q.id} value={q.id}>
                      {MATIERE_LABELS[q.matiere]} · {NIVEAU_LABELS[q.niveau]} — {q.titre}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-ink-muted">Aucun quiz créé pour le moment.</p>
              )}
              <Link href="/prof/quiz/nouveau" className="link-muted w-fit text-sm">
                + Créer un nouveau quiz
              </Link>
            </div>
          )}
        </div>
      )}

      {cours?.id && (
        <label className="flex items-center gap-2 text-sm font-medium text-ink-secondary">
          <input
            type="checkbox"
            name="publie"
            checked={publie}
            onChange={(e) => setPublie(e.target.checked)}
            className="h-4 w-4 rounded border-space-border accent-neon-blue"
          />
          Publier ce cours (visible par les élèves du niveau correspondant)
        </label>
      )}

      {message && (
        <p
          className={`text-sm ${enregistre ? "text-emerald-400" : "text-red-400"}`}
          role="alert"
        >
          {message}
        </p>
      )}

      {cours?.id ? (
        <button type="submit" disabled={isPending} className="btn-primary mt-2 self-start">
          {isPending ? "Enregistrement..." : submitLabel}
        </button>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input ref={publieRef} type="hidden" name="publie" defaultValue="" />
          <button
            type="submit"
            disabled={isPending}
            onClick={() => {
              if (publieRef.current) publieRef.current.value = "";
            }}
            className="btn-secondary"
          >
            {isPending ? "Enregistrement..." : "Enregistrer en brouillon"}
          </button>
          <button
            type="submit"
            disabled={isPending}
            onClick={() => {
              if (publieRef.current) publieRef.current.value = "on";
            }}
            className="btn-primary"
          >
            {isPending ? "Enregistrement..." : "Créer et publier"}
          </button>
        </div>
      )}
    </form>
  );
}
