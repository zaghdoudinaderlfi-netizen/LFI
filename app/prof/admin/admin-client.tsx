"use client";

import {
  useActionState,
  useEffect,
  useState,
  useTransition,
} from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, GripVertical, KeyRound, Pencil, Trash2, X, Copy, Check } from "lucide-react";
import { NIVEAU_LABELS } from "@/lib/classes-constants";
import { formaterNomComplet } from "@/lib/utilisateurs";
import { useToast } from "@/components/ui/toast";
import {
  reinitMdpEleveAction,
  modifierEleveAction,
  supprimerEleveAction,
  supprimerClasseAction,
  deplacerEleveAction,
} from "./actions";
import type { Niveau } from "@prisma/client";

// ── Types ─────────────────────────────────────────────────────────────────────

type Eleve = {
  id: string;
  nom: string;
  prenom: string | null;
  email: string;
  doitChangerMdp: boolean;
  classeId: string | null;
  classe: { id: string; nom: string; niveau: Niveau } | null;
};

type ClasseSimple = {
  id: string;
  nom: string;
  niveau: Niveau;
  anneeScolaire: string;
};

// ── Composant principal ───────────────────────────────────────────────────────

// Id du droppable "sans classe" — distinct des cuid de vraies classes.
const DROPPABLE_SANS_CLASSE = "sans-classe";

export function AdminClient({
  eleves,
  classes,
}: {
  eleves: Eleve[];
  classes: ClasseSimple[];
}) {
  const [recherche, setRecherche] = useState("");
  const [filtreClasse, setFiltreClasse] = useState<string>("toutes");
  const [mdpVisible, setMdpVisible] = useState<{ eleveId: string; nom: string; mdp: string } | null>(null);
  const [activeEleve, setActiveEleve] = useState<Eleve | null>(null);
  const [, startDeplacement] = useTransition();
  const { addToast } = useToast();

  // État local optimiste : le déplacement met à jour l'écran tout de suite,
  // sans attendre la réponse serveur. Resynchronisé quand la donnée serveur
  // change réellement (revalidation après l'action, ou une autre source).
  const signatureRecue = eleves.map((e) => `${e.id}:${e.classeId ?? ""}`).join(",");
  const [signatureConnue, setSignatureConnue] = useState(signatureRecue);
  const [elevesLocal, setElevesLocal] = useState(eleves);
  if (signatureRecue !== signatureConnue) {
    setSignatureConnue(signatureRecue);
    setElevesLocal(eleves);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    const eleve = elevesLocal.find((e) => e.id === String(event.active.id));
    setActiveEleve(eleve ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveEleve(null);
    const { active, over } = event;
    if (!over) return;

    const eleveId = String(active.id);
    const cibleId = String(over.id);
    const nouvelleClasseId = cibleId === DROPPABLE_SANS_CLASSE ? null : cibleId;

    const eleve = elevesLocal.find((e) => e.id === eleveId);
    if (!eleve) return;
    if ((eleve.classeId ?? null) === nouvelleClasseId) return;

    const classeCible = nouvelleClasseId ? classes.find((c) => c.id === nouvelleClasseId) : null;
    const nomAffiche = classeCible ? classeCible.nom : "Sans classe";
    const eleveAvant = eleve;

    setElevesLocal((prev) =>
      prev.map((e) =>
        e.id === eleveId
          ? {
              ...e,
              classeId: nouvelleClasseId,
              classe: classeCible
                ? { id: classeCible.id, nom: classeCible.nom, niveau: classeCible.niveau }
                : null,
            }
          : e,
      ),
    );

    startDeplacement(async () => {
      const res = await deplacerEleveAction(eleveId, nouvelleClasseId);
      if (res.ok) {
        addToast({
          type: "success",
          message: `${formaterNomComplet(eleveAvant)} déplacé vers ${res.classeNom ?? nomAffiche}.`,
        });
      } else {
        setElevesLocal((prev) => prev.map((e) => (e.id === eleveId ? eleveAvant : e)));
        addToast({ type: "error", message: res.erreur ?? "Erreur inconnue." });
      }
    });
  }

  const elevesFiltrés = elevesLocal.filter((e) => {
    const nom = formaterNomComplet(e).toLowerCase();
    const matchRecherche = nom.includes(recherche.toLowerCase());
    const matchClasse =
      filtreClasse === "toutes" ||
      (filtreClasse === "sans-classe" ? !e.classeId : e.classeId === filtreClasse);
    return matchRecherche && matchClasse;
  });

  // Regroupe par classe pour l'affichage. En vue par défaut (sans recherche
  // ni filtre), les classes vides restent affichées : sinon elles
  // n'existeraient pas comme cible pour le glisser-déposer.
  const vueParDefaut = recherche === "" && filtreClasse === "toutes";
  const elevesSansClasse = elevesFiltrés.filter((e) => !e.classe);
  const elevesByClasse = classes
    .map((c) => ({
      classe: c,
      eleves: elevesFiltrés.filter((e) => e.classeId === c.id),
    }))
    .filter((g) => g.eleves.length > 0 || vueParDefaut);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {/* Barre de recherche + filtre */}
      <div className="card animate-fade-in-up flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Rechercher par nom ou prénom…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="input flex-1"
        />
        <select
          value={filtreClasse}
          onChange={(e) => setFiltreClasse(e.target.value)}
          className="input sm:w-52"
        >
          <option value="toutes">Toutes les classes</option>
          <option value="sans-classe">Sans classe</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom} – {NIVEAU_LABELS[c.niveau]}
            </option>
          ))}
        </select>
      </div>

      {elevesFiltrés.length === 0 && (
        <p className="card animate-fade-in-up p-6 text-center text-sm text-ink-muted">
          Aucun élève trouvé.
        </p>
      )}

      {/* Groupes par classe */}
      {elevesByClasse.map(({ classe, eleves: gr }) => (
        <GroupeClasse
          key={classe.id}
          droppableId={classe.id}
          titre={`${classe.nom} — ${NIVEAU_LABELS[classe.niveau]} (${classe.anneeScolaire})`}
          classe={classe}
          totalEleves={elevesLocal.filter((e) => e.classeId === classe.id).length}
          eleves={gr}
          classes={classes}
          onMdpReset={setMdpVisible}
        />
      ))}

      {elevesSansClasse.length > 0 && (
        <GroupeClasse
          droppableId={DROPPABLE_SANS_CLASSE}
          titre="Sans classe"
          eleves={elevesSansClasse}
          classes={classes}
          onMdpReset={setMdpVisible}
        />
      )}

      {/* Modale affichage mot de passe temporaire */}
      {mdpVisible && (
        <ModaleMdpTemp
          nom={mdpVisible.nom}
          mdp={mdpVisible.mdp}
          onClose={() => setMdpVisible(null)}
        />
      )}

      <DragOverlay>
        {activeEleve && (
          <div className="flex items-center gap-2 rounded-xl border border-neon-violet/40 bg-space-surface px-4 py-2.5 shadow-2xl">
            <GripVertical className="h-4 w-4 text-ink-muted" />
            <span className="text-sm font-medium text-ink-primary">
              {formaterNomComplet(activeEleve)}
            </span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

// ── Groupe d'une classe ───────────────────────────────────────────────────────

function GroupeClasse({
  titre,
  droppableId,
  classe,
  totalEleves,
  eleves,
  classes,
  onMdpReset,
}: {
  titre: string;
  droppableId: string;
  classe?: ClasseSimple;
  totalEleves?: number;
  eleves: Eleve[];
  classes: ClasseSimple[];
  onMdpReset: (v: { eleveId: string; nom: string; mdp: string }) => void;
}) {
  const [ouvert, setOuvert] = useState(true);
  const [enSuppression, startSuppression] = useTransition();
  const { addToast } = useToast();
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  function handleSupprimerClasse() {
    if (!classe) return;
    const n = totalEleves ?? eleves.length;
    const message =
      n === 0
        ? `Supprimer la classe « ${classe.nom} » ?\n\nElle ne contient aucun élève, confirmer ?`
        : `Supprimer la classe « ${classe.nom} » ?\n\nCela supprimera aussi les ${n} élève${n !== 1 ? "s" : ""} de cette classe, confirmer ?`;
    if (!confirm(message)) return;

    startSuppression(async () => {
      const res = await supprimerClasseAction(classe.id);
      if (!res.ok) {
        addToast({ type: "error", message: res.erreur ?? "Erreur inconnue." });
      }
    });
  }

  return (
    <section
      ref={setNodeRef}
      className={`card animate-fade-in-up overflow-hidden transition-colors ${
        isOver ? "ring-2 ring-neon-violet/60 bg-neon-violet/5" : ""
      }`}
    >
      <div className="flex w-full items-center justify-between gap-2 px-5 py-4 hover:bg-space-surface2/50 transition-colors">
        <button
          type="button"
          onClick={() => setOuvert((o) => !o)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <span className="font-semibold text-ink-primary">
            {titre}{" "}
            <span className="ml-1 text-sm font-normal text-ink-secondary">
              ({eleves.length} élève{eleves.length > 1 ? "s" : ""})
            </span>
          </span>
        </button>
        <div className="flex items-center gap-1">
          {classe && (
            <button
              type="button"
              onClick={handleSupprimerClasse}
              disabled={enSuppression}
              title="Supprimer la classe"
              className="btn-ghost gap-1.5 py-1 text-xs text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {enSuppression ? "…" : "Supprimer"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setOuvert((o) => !o)}
            aria-label={ouvert ? "Replier" : "Déplier"}
            className="rounded-lg p-1.5 text-ink-muted hover:text-ink-primary"
          >
            {ouvert ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {ouvert && (
        <ul className="divide-y divide-space-border">
          {eleves.length === 0 && (
            <li className="px-5 py-4 text-sm text-ink-muted">
              Aucun élève — glisse une fiche élève ici pour l&apos;ajouter à cette classe.
            </li>
          )}
          {eleves.map((e) => (
            <LigneEleve
              key={e.id}
              eleve={e}
              classes={classes}
              onMdpReset={onMdpReset}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

// ── Ligne élève ───────────────────────────────────────────────────────────────

function LigneEleve({
  eleve,
  classes,
  onMdpReset,
}: {
  eleve: Eleve;
  classes: ClasseSimple[];
  onMdpReset: (v: { eleveId: string; nom: string; mdp: string }) => void;
}) {
  const [modeEdition, setModeEdition] = useState(false);
  const [enReinit, startReinit] = useTransition();
  const [enSuppression, startSuppression] = useTransition();
  const { addToast } = useToast();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: eleve.id,
  });

  function handleSupprimer() {
    if (
      !confirm(
        `Supprimer l'élève ${formaterNomComplet(eleve)} ?\n\n` +
          `Action irréversible — ses soumissions, tentatives de quiz, comptes-rendus et notifications seront aussi supprimés.`,
      )
    )
      return;

    startSuppression(async () => {
      const res = await supprimerEleveAction(eleve.id);
      if (!res.ok) {
        addToast({ type: "error", message: res.erreur ?? "Erreur inconnue." });
      }
    });
  }

  async function handleReinit() {
    if (
      !confirm(
        `Réinitialiser le mot de passe de ${formaterNomComplet(eleve)} ?\n` +
        `Le nouveau mot de passe temporaire sera affiché une seule fois.`,
      )
    ) return;

    startReinit(async () => {
      const res = await reinitMdpEleveAction(eleve.id);
      if (res.ok && res.mdpTemp) {
        onMdpReset({ eleveId: eleve.id, nom: formaterNomComplet(eleve), mdp: res.mdpTemp });
      } else {
        addToast({ type: "error", message: res.erreur ?? "Erreur inconnue." });
      }
    });
  }

  return (
    <li
      ref={setNodeRef}
      className={`px-5 py-3 transition-opacity ${isDragging ? "opacity-30" : ""}`}
      style={
        transform
          ? { transform: CSS.Translate.toString(transform), zIndex: isDragging ? 10 : undefined }
          : undefined
      }
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            title="Glisser vers une autre classe"
            aria-label={`Déplacer ${formaterNomComplet(eleve)} vers une autre classe`}
            className="cursor-grab touch-none rounded p-1 text-ink-muted hover:text-ink-primary active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="flex flex-col gap-0.5">
            <p className="font-medium text-ink-primary">
              {formaterNomComplet(eleve)}
              {eleve.doitChangerMdp && (
                <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                  mdp temporaire
                </span>
              )}
            </p>
            <p className="text-xs text-ink-muted">{eleve.email}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setModeEdition(true)}
            className="btn-ghost gap-1.5 py-1 text-xs"
          >
            <Pencil className="h-3.5 w-3.5" />
            Modifier
          </button>
          <button
            type="button"
            onClick={handleReinit}
            disabled={enReinit}
            className="btn-ghost gap-1.5 py-1 text-xs text-amber-400 hover:bg-amber-500/10"
          >
            <KeyRound className="h-3.5 w-3.5" />
            {enReinit ? "…" : "Réinitialiser mdp"}
          </button>
          <button
            type="button"
            onClick={handleSupprimer}
            disabled={enSuppression}
            className="btn-ghost gap-1.5 py-1 text-xs text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {enSuppression ? "…" : "Supprimer"}
          </button>
        </div>
      </div>

      {modeEdition && (
        <FormModifierEleve
          eleve={eleve}
          classes={classes}
          onClose={() => setModeEdition(false)}
        />
      )}
    </li>
  );
}

// ── Formulaire modification élève ─────────────────────────────────────────────

function FormModifierEleve({
  eleve,
  classes,
  onClose,
}: {
  eleve: Eleve;
  classes: ClasseSimple[];
  onClose: () => void;
}) {
  const [message, formAction, isPending] = useActionState(modifierEleveAction, undefined);
  const { addToast } = useToast();

  useEffect(() => {
    if (!message) return;
    if (message === "ok") {
      addToast({ type: "success", message: "Élève mis à jour." });
      onClose();
    } else {
      addToast({ type: "error", message });
    }
  }, [message, addToast, onClose]);

  return (
    <form
      action={formAction}
      className="mt-3 rounded-xl border border-space-border bg-space-surface2/60 p-4 flex flex-col gap-3"
    >
      <input type="hidden" name="eleveId" value={eleve.id} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="field-label">Prénom</label>
          <input
            name="prenom"
            type="text"
            defaultValue={eleve.prenom ?? ""}
            className="input"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="field-label">Nom</label>
          <input
            name="nom"
            type="text"
            required
            defaultValue={eleve.nom}
            className="input"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="field-label">Adresse email</label>
        <input
          name="email"
          type="email"
          defaultValue={eleve.email}
          className="input"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="field-label">Classe</label>
        <select name="classeId" defaultValue={eleve.classeId ?? ""} className="input">
          <option value="">— Sans classe —</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom} – {NIVEAU_LABELS[c.niveau]} ({c.anneeScolaire})
            </option>
          ))}
        </select>
      </div>

      {message && message !== "ok" && (
        <p className="text-sm text-red-400">{message}</p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button type="button" onClick={onClose} className="btn-ghost">
          Annuler
        </button>
      </div>
    </form>
  );
}

// ── Modale mot de passe temporaire ───────────────────────────────────────────

function ModaleMdpTemp({
  nom,
  mdp,
  onClose,
}: {
  nom: string;
  mdp: string;
  onClose: () => void;
}) {
  const [copie, setCopie] = useState(false);

  async function copier() {
    await navigator.clipboard.writeText(mdp);
    setCopie(true);
    setTimeout(() => setCopie(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-space-border bg-space-surface p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-ink-muted hover:text-ink-primary"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-1 font-heading text-lg font-bold text-ink-primary">
          Mot de passe réinitialisé
        </h2>
        <p className="mb-5 text-sm text-ink-secondary">
          Communique ce mot de passe temporaire à <strong>{nom}</strong>.
          Il ne sera affiché qu&apos;une seule fois.
        </p>

        <div className="flex items-center gap-2 rounded-xl border border-neon-cyan/30 bg-space-surface2 px-4 py-3">
          <span className="flex-1 font-mono text-xl font-bold tracking-widest text-neon-cyan">
            {mdp}
          </span>
          <button
            type="button"
            onClick={copier}
            className="rounded-lg p-2 text-ink-secondary transition-colors hover:bg-space-surface hover:text-neon-cyan"
            aria-label="Copier"
          >
            {copie ? (
              <Check className="h-4 w-4 text-emerald-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>

        <p className="mt-3 text-xs text-ink-muted">
          L&apos;élève sera invité à changer ce mot de passe à sa prochaine connexion.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="btn-primary mt-5 w-full"
        >
          J&apos;ai noté le mot de passe
        </button>
      </div>
    </div>
  );
}
