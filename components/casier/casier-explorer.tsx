"use client";

import { useRef, useState, type DragEvent, type FormEvent } from "react";
import {
  ArrowLeft,
  Check,
  Download,
  File as FileIcon,
  Folder,
  FolderPlus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { formaterTaille } from "@/lib/fichiers";
import { useToast } from "@/components/ui/toast";

/** Une action serveur : undefined/rien en cas de succès, un message d'erreur sinon. */
type Resultat = Promise<string | undefined | void> | void;

/** Signature d'une Server Action liée à un <form> (voir useActionState). */
type ActionUpload = (
  prevState: string | undefined,
  formData: FormData
) => Promise<string | undefined>;

export type DocumentCasierUI = {
  id: string;
  nom: string;
  taille: number;
  dossierId: string | null;
  /** Info complémentaire optionnelle (ex: nom de l'élève, pour une vue prof). */
  meta?: string;
};

export type DossierCasierUI = {
  id: string;
  nom: string;
  nbDocuments: number;
};

/**
 * Explorateur façon "vrai casier" : dossiers cliquables (un seul niveau),
 * fichiers glissables dans un dossier ou vers la corbeille, avec un menu de
 * rangement par clic en repli (le glisser-déposer natif HTML5 ne marche pas
 * au toucher, donc pas fiable seul sur tablette).
 *
 * lectureSeule=true : navigation et téléchargement uniquement (ex. un élève
 * qui consulte les dossiers partagés par son prof) — aucune action de
 * gestion n'est proposée.
 */
export function CasierExplorer({
  dossiers,
  documents,
  lectureSeule = false,
  onCreerDossier,
  onRenommerDossier,
  onSupprimerDossier,
  onSupprimerDocument,
  onDeplacerDocument,
  uploadAction,
  libelleUpload,
  champsCachesUpload,
}: {
  dossiers: DossierCasierUI[];
  documents: DocumentCasierUI[];
  lectureSeule?: boolean;
  onCreerDossier?: (nom: string) => Resultat;
  onRenommerDossier?: (id: string, nom: string) => Resultat;
  onSupprimerDossier?: (id: string) => Resultat;
  onSupprimerDocument?: (id: string) => Resultat;
  onDeplacerDocument?: (id: string, dossierId: string | null) => Resultat;
  /** Server Action d'upload — absente en lecture seule. */
  uploadAction?: ActionUpload;
  libelleUpload?: string;
  /** Champs cachés supplémentaires du formulaire d'upload (ex: matière). */
  champsCachesUpload?: Record<string, string>;
}) {
  const [dossierOuvertId, setDossierOuvertId] = useState<string | null>(null);
  const [cibleSurvolee, setCibleSurvolee] = useState<string | null>(null);
  const [creationEnCours, setCreationEnCours] = useState(false);
  const [nomEnSaisie, setNomEnSaisie] = useState("");
  const [renommageId, setRenommageId] = useState<string | null>(null);
  const { addToast } = useToast();

  const dossierOuvert = dossiers.find((d) => d.id === dossierOuvertId) ?? null;
  const documentsAffiches = documents.filter((d) => d.dossierId === dossierOuvertId);

  async function executer(action: Resultat | undefined) {
    const erreur = await action;
    if (erreur) addToast({ type: "error", message: erreur });
  }

  function poserDocId(e: DragEvent<HTMLElement>): string | null {
    const id = e.dataTransfer.getData("text/plain");
    return id || null;
  }

  function survoler(e: DragEvent<HTMLElement>, cible: string) {
    e.preventDefault();
    if (cibleSurvolee !== cible) setCibleSurvolee(cible);
  }

  function quitterSurvol() {
    setCibleSurvolee(null);
  }

  function deposerDans(e: DragEvent<HTMLElement>, dossierId: string | null) {
    e.preventDefault();
    setCibleSurvolee(null);
    const id = poserDocId(e);
    if (id) executer(onDeplacerDocument?.(id, dossierId));
  }

  function deposerCorbeille(e: DragEvent<HTMLElement>) {
    e.preventDefault();
    setCibleSurvolee(null);
    const id = poserDocId(e);
    if (id) executer(onSupprimerDocument?.(id));
  }

  function validerCreation() {
    const nom = nomEnSaisie.trim();
    if (nom) executer(onCreerDossier?.(nom));
    setNomEnSaisie("");
    setCreationEnCours(false);
  }

  function validerRenommage(id: string, nom: string) {
    const propre = nom.trim();
    if (propre) executer(onRenommerDossier?.(id, propre));
    setRenommageId(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Fil d'ariane / en-tête du dossier ouvert */}
      {dossierOuvert ? (
        <div
          onDragOver={(e) => survoler(e, "retour")}
          onDragLeave={quitterSurvol}
          onDrop={(e) => deposerDans(e, null)}
          className={`flex items-center justify-between gap-3 rounded-xl border-2 border-dashed px-3 py-2 transition-colors ${
            cibleSurvolee === "retour"
              ? "border-neon-cyan bg-neon-cyan/10"
              : "border-transparent"
          }`}
        >
          <button
            type="button"
            onClick={() => setDossierOuvertId(null)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-secondary hover:text-ink-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Casier
          </button>
          <span className="text-ink-muted">/</span>
          {!lectureSeule && renommageId === dossierOuvert.id ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                validerRenommage(dossierOuvert.id, nomEnSaisie);
              }}
              className="flex flex-1 items-center gap-1.5"
            >
              <input
                autoFocus
                defaultValue={dossierOuvert.nom}
                onChange={(e) => setNomEnSaisie(e.target.value)}
                className="input py-1 text-sm"
              />
              <button type="submit" className="rounded-lg p-1.5 text-emerald-400 hover:bg-space-surface2">
                <Check className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setRenommageId(null)}
                className="rounded-lg p-1.5 text-ink-muted hover:bg-space-surface2"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <div className="flex flex-1 items-center gap-2">
              <Folder className="h-4 w-4 shrink-0 text-amber-400" />
              <p className="truncate font-semibold text-ink-primary">{dossierOuvert.nom}</p>
              {!lectureSeule && (
                <div className="ml-auto flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    title="Renommer le dossier"
                    onClick={() => {
                      setRenommageId(dossierOuvert.id);
                      setNomEnSaisie(dossierOuvert.nom);
                    }}
                    className="rounded-lg p-1.5 text-ink-muted hover:bg-space-surface2 hover:text-ink-primary"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Supprimer le dossier (les fichiers reviennent à la racine)"
                    onClick={() => {
                      executer(onSupprimerDossier?.(dossierOuvert.id));
                      setDossierOuvertId(null);
                    }}
                    className="rounded-lg p-1.5 text-ink-muted hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        dossiers.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {dossiers.map((dossier) => (
              <button
                key={dossier.id}
                type="button"
                onClick={() => setDossierOuvertId(dossier.id)}
                onDragOver={(e) => survoler(e, dossier.id)}
                onDragLeave={quitterSurvol}
                onDrop={(e) => deposerDans(e, dossier.id)}
                className={`card-interactive flex flex-col items-center gap-1.5 p-4 text-center transition-colors ${
                  cibleSurvolee === dossier.id ? "border-neon-cyan bg-neon-cyan/10" : ""
                }`}
              >
                <Folder className="h-9 w-9 text-amber-400" fill="currentColor" fillOpacity={0.15} />
                <p className="w-full truncate text-sm font-medium text-ink-primary">{dossier.nom}</p>
                <p className="text-xs text-ink-muted">
                  {dossier.nbDocuments} fichier{dossier.nbDocuments > 1 ? "s" : ""}
                </p>
              </button>
            ))}
          </div>
        )
      )}

      {/* Création d'un nouveau dossier — uniquement à la racine */}
      {!lectureSeule && !dossierOuvert && (
        <div>
          {creationEnCours ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                validerCreation();
              }}
              className="flex items-center gap-2"
            >
              <input
                autoFocus
                value={nomEnSaisie}
                onChange={(e) => setNomEnSaisie(e.target.value)}
                placeholder="Nom du dossier"
                className="input flex-1 py-1.5 text-sm sm:max-w-xs"
              />
              <button type="submit" className="btn-secondary py-1.5 text-sm">
                Créer
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreationEnCours(false);
                  setNomEnSaisie("");
                }}
                className="btn-ghost py-1.5 text-sm"
              >
                Annuler
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setCreationEnCours(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-secondary hover:text-ink-primary"
            >
              <FolderPlus className="h-4 w-4" />
              Nouveau dossier
            </button>
          )}
        </div>
      )}

      {/* Fichiers du niveau courant (racine ou dossier ouvert) */}
      {documentsAffiches.length === 0 ? (
        <p className="text-sm text-ink-muted">
          {dossierOuvert ? "Ce dossier est vide." : "Aucun fichier en vrac."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {documentsAffiches.map((doc) => (
            <li
              key={doc.id}
              draggable={!lectureSeule}
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", doc.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              className={`flex items-center justify-between gap-3 rounded-xl border border-space-border bg-space-surface2/60 px-3 py-2 ${
                !lectureSeule ? "cursor-grab active:cursor-grabbing" : ""
              }`}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <FileIcon className="h-4 w-4 shrink-0 text-ink-muted" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-primary">{doc.nom}</p>
                  <p className="text-xs text-ink-muted">
                    {doc.meta ? `${doc.meta} · ` : ""}
                    {formaterTaille(doc.taille)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {!lectureSeule && dossiers.length > 0 && (
                  <select
                    value={doc.dossierId ?? ""}
                    onChange={(e) => executer(onDeplacerDocument?.(doc.id, e.target.value || null))}
                    title="Ranger dans..."
                    className="rounded-lg border border-space-border bg-space-surface2 px-1.5 py-1 text-xs text-ink-secondary"
                  >
                    <option value="">Racine</option>
                    {dossiers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nom}
                      </option>
                    ))}
                  </select>
                )}
                <a
                  href={`/api/casier/${doc.id}`}
                  title="Télécharger"
                  className="rounded-lg p-1.5 text-ink-muted hover:bg-space-surface2 hover:text-ink-primary"
                >
                  <Download className="h-4 w-4" />
                </a>
                {!lectureSeule && (
                  <button
                    type="button"
                    title="Supprimer"
                    onClick={() => executer(onSupprimerDocument?.(doc.id))}
                    className="rounded-lg p-1.5 text-ink-muted hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!lectureSeule && uploadAction && (
        <FormulaireUpload
          action={uploadAction}
          dossierId={dossierOuvertId}
          libelle={libelleUpload ?? "Déposer un fichier"}
          champsCaches={champsCachesUpload}
        />
      )}

      {/* Corbeille — cible de glisser-déposer, toujours visible dès qu'il y a
          au moins un fichier quelque part dans le casier. */}
      {!lectureSeule && documents.length > 0 && (
        <div
          onDragOver={(e) => survoler(e, "corbeille")}
          onDragLeave={quitterSurvol}
          onDrop={deposerCorbeille}
          className={`flex items-center justify-center gap-2 rounded-xl border-2 border-dashed px-3 py-3 text-sm transition-colors ${
            cibleSurvolee === "corbeille"
              ? "border-red-400 bg-red-500/10 text-red-400"
              : "border-space-border text-ink-muted"
          }`}
        >
          <Trash2 className="h-4 w-4" />
          Glisse un fichier ici pour le supprimer
        </div>
      )}
    </div>
  );
}

/**
 * Formulaire de dépôt, interne à l'explorateur : un simple onSubmit qui
 * appelle l'action serveur directement (pas useActionState) — le champ
 * dossierId doit refléter l'état client du dossier ouvert, une valeur qui
 * ne peut pas être fixée par le composant serveur parent.
 */
function FormulaireUpload({
  action,
  dossierId,
  libelle,
  champsCaches,
}: {
  action: ActionUpload;
  dossierId: string | null;
  libelle: string;
  champsCaches?: Record<string, string>;
}) {
  const [enCours, setEnCours] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { addToast } = useToast();

  async function soumettre(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setEnCours(true);
    const erreur = await action(undefined, formData);
    setEnCours(false);
    if (erreur) {
      addToast({ type: "error", message: erreur });
      return;
    }
    formRef.current?.reset();
  }

  return (
    <form
      ref={formRef}
      onSubmit={soumettre}
      className="flex flex-col gap-2 border-t border-space-border pt-4 sm:flex-row sm:items-end sm:gap-3"
    >
      {dossierId && <input type="hidden" name="dossierId" value={dossierId} />}
      {champsCaches &&
        Object.entries(champsCaches).map(([nom, valeur]) => (
          <input key={nom} type="hidden" name={nom} value={valeur} />
        ))}
      <div className="flex flex-1 flex-col gap-1">
        <label className="field-label">
          {libelle}
          {dossierId ? " dans ce dossier" : ""}
        </label>
        <input
          name="fichier"
          type="file"
          required
          className="input file:mr-3 file:rounded file:border-0 file:bg-space-surface file:px-3 file:py-1 file:text-sm file:text-ink-primary"
        />
      </div>
      <button type="submit" disabled={enCours} className="btn-primary">
        {enCours ? "Envoi..." : "Envoyer"}
      </button>
    </form>
  );
}
