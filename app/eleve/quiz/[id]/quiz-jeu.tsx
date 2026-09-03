"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Circle,
  Crown,
  Diamond,
  Flame,
  Gamepad2,
  Medal,
  Square,
  Trophy,
  Triangle,
  X,
} from "lucide-react";
import type { QuestionPourEleve, ResultatReponse } from "@/lib/quiz";
import { demarrerTentativeAction, repondreAction } from "./actions";

type ChoixInfo = {
  lettre: "A" | "B" | "C" | "D";
  icone: typeof Triangle;
  classe: string;
};

const CHOIX: ChoixInfo[] = [
  { lettre: "A", icone: Triangle, classe: "bg-red-600 hover:bg-red-500 active:bg-red-700" },
  { lettre: "B", icone: Diamond, classe: "bg-blue-600 hover:bg-blue-500 active:bg-blue-700" },
  { lettre: "C", icone: Circle, classe: "bg-amber-500 hover:bg-amber-400 active:bg-amber-600" },
  { lettre: "D", icone: Square, classe: "bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700" },
];

type EtatJeu = "accueil" | "chargement" | "question" | "feedback" | "resultats" | "erreur";

export function QuizJeu({
  quizId,
  titre,
  nbQuestions,
  meilleurScore,
}: {
  quizId: string;
  titre: string;
  nbQuestions: number;
  meilleurScore: number | null;
}) {
  const [etat, setEtat] = useState<EtatJeu>("accueil");
  const [erreur, setErreur] = useState<string | null>(null);
  const [tentativeId, setTentativeId] = useState<string | null>(null);
  const [question, setQuestion] = useState<QuestionPourEleve | null>(null);
  const [reponseChoisie, setReponseChoisie] = useState<number | null>(null);
  const [dernierResultat, setDernierResultat] = useState<ResultatReponse | null>(null);
  const [scoreCourant, setScoreCourant] = useState(0);
  const [bonnesReponses, setBonnesReponses] = useState(0);
  const [serie, setSerie] = useState(0);
  const [multiplicateur, setMultiplicateur] = useState(1);
  const [serieVientDeCasser, setSerieVientDeCasser] = useState(false);

  const debutQuestionRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enTraitementRef = useRef(false);
  const serieRef = useRef(0);

  const nettoyerTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => () => nettoyerTimeout(), [nettoyerTimeout]);

  async function demarrer() {
    setErreur(null);
    setEtat("chargement");
    const res = await demarrerTentativeAction(quizId);
    if (!res.ok) {
      setErreur(res.erreur);
      setEtat("erreur");
      return;
    }
    setTentativeId(res.tentativeId);
    setQuestion(res.question);
    setScoreCourant(0);
    setBonnesReponses(0);
    setSerie(0);
    setMultiplicateur(1);
    setSerieVientDeCasser(false);
    serieRef.current = 0;
    lancerQuestion();
  }

  function lancerQuestion() {
    setReponseChoisie(null);
    enTraitementRef.current = false;
    debutQuestionRef.current = Date.now();
    setSerieVientDeCasser(false);
    setEtat("question");
  }

  // Déclenche le décompte à chaque nouvelle question affichée.
  useEffect(() => {
    if (etat !== "question" || !question) return;

    nettoyerTimeout();
    timeoutRef.current = setTimeout(() => {
      envoyerReponse(null);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, question.tempsLimiteSec * 1000);

    return nettoyerTimeout;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etat, question?.id]);

  async function envoyerReponse(index: number | null) {
    if (enTraitementRef.current || !tentativeId || !question) return;
    enTraitementRef.current = true;
    nettoyerTimeout();

    const tempsMs = Date.now() - debutQuestionRef.current;
    setReponseChoisie(index);

    const res = await repondreAction(tentativeId, question.id, index, tempsMs);
    if (!res.ok) {
      setErreur(res.erreur);
      setEtat("erreur");
      return;
    }

    setDernierResultat(res.resultat);
    setScoreCourant(res.resultat.scoreTotal);
    setBonnesReponses(res.resultat.bonnesReponsesTotal);
    setMultiplicateur(res.resultat.multiplicateur);
    setSerieVientDeCasser(serieRef.current > 0 && res.resultat.serieActuelle === 0);
    setSerie(res.resultat.serieActuelle);
    serieRef.current = res.resultat.serieActuelle;
    setEtat("feedback");

    setTimeout(() => {
      if (res.resultat.terminee) {
        setEtat("resultats");
      } else if (res.resultat.questionSuivante) {
        setQuestion(res.resultat.questionSuivante);
        lancerQuestion();
      }
    }, 2500);
  }

  // ─── Accueil ─────────────────────────────────────────────
  if (etat === "accueil" || etat === "chargement" || etat === "erreur") {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4 animate-fade-in-up">
          <div>
            <p className="eyebrow">Quiz</p>
            <h1 className="page-title">{titre}</h1>
          </div>
          <Link href="/eleve/quiz" className="btn-secondary">
            Retour
          </Link>
        </div>

        <div className="card animate-fade-in-up flex flex-col items-center gap-4 p-10 text-center [animation-delay:60ms]">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-space-surface2 text-neon-violet shadow-glow-soft">
            <Gamepad2 className="h-8 w-8" />
          </span>
          <p className="text-ink-secondary">
            {nbQuestions} question{nbQuestions > 1 ? "s" : ""}
          </p>

          {meilleurScore !== null && (
            <span className="inline-flex items-center gap-1.5 badge bg-amber-500/15 px-3 text-amber-300 ring-1 ring-amber-500/30">
              <Trophy className="h-4 w-4" />
              Ton meilleur score : {meilleurScore}
            </span>
          )}

          {erreur && (
            <p className="text-sm text-red-400" role="alert">
              {erreur}
            </p>
          )}

          <button
            type="button"
            onClick={demarrer}
            disabled={etat === "chargement"}
            className="btn-primary mt-2 px-8 py-3 text-base"
          >
            {etat === "chargement" ? "Chargement..." : meilleurScore !== null ? "Rejouer" : "Jouer"}
          </button>
        </div>
      </div>
    );
  }

  // ─── Question / Feedback / Résultats : plein écran ──────
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-space-bg">
      {(etat === "question" || etat === "feedback") && question && (
        <EcranQuestion
          question={question}
          etat={etat}
          reponseChoisie={reponseChoisie}
          resultat={etat === "feedback" ? dernierResultat : null}
          serie={serie}
          multiplicateur={multiplicateur}
          serieVientDeCasser={serieVientDeCasser}
          onRepondre={envoyerReponse}
        />
      )}

      {etat === "resultats" && dernierResultat && (
        <EcranResultats
          titre={titre}
          score={scoreCourant}
          bonnesReponses={bonnesReponses}
          totalQuestions={nbQuestions}
          serieMax={dernierResultat.serieMax}
          classement={dernierResultat.classement ?? null}
          onRejouer={demarrer}
        />
      )}
    </div>
  );
}

function EcranQuestion({
  question,
  etat,
  reponseChoisie,
  resultat,
  serie,
  multiplicateur,
  serieVientDeCasser,
  onRepondre,
}: {
  question: QuestionPourEleve;
  etat: "question" | "feedback";
  reponseChoisie: number | null;
  resultat: ResultatReponse | null;
  serie: number;
  multiplicateur: number;
  serieVientDeCasser: boolean;
  onRepondre: (index: number) => void;
}) {
  const choixTextes = [question.choixA, question.choixB, question.choixC, question.choixD];

  return (
    <div className="flex h-full flex-col p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/eleve/quiz"
          className="inline-flex items-center gap-1 rounded-full bg-space-surface2/80 p-2 text-ink-muted hover:text-ink-primary"
          aria-label="Quitter le quiz"
        >
          <X className="h-5 w-5" />
        </Link>
        <span className="text-sm font-medium text-ink-secondary">
          Question {question.index} / {question.total}
        </span>
        <span className="w-9" />
      </div>

      <div className="mt-2 flex justify-center">
        <AnimatePresence mode="wait">
          {serieVientDeCasser ? (
            <motion.span
              key="cassee"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-full bg-space-surface2/60 px-3 py-1 text-xs text-ink-muted"
            >
              Série remise à zéro
            </motion.span>
          ) : serie > 0 ? (
            <SerieBadge key="serie" serie={serie} multiplicateur={multiplicateur} />
          ) : null}
        </AnimatePresence>
      </div>

      {/* Barre de temps */}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-space-surface2">
        {etat === "question" && (
          <motion.div
            key={question.id}
            className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-violet"
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: question.tempsLimiteSec, ease: "linear" }}
          />
        )}
      </div>

      <div className="flex flex-1 items-center justify-center py-6">
        <h2 className="max-w-2xl text-center text-xl font-bold text-ink-primary sm:text-2xl">
          {question.enonce}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 pb-4 sm:grid-cols-2 sm:gap-4">
        {CHOIX.map((c, i) => {
          const Icone = c.icone;
          const estChoisi = reponseChoisie === i;
          const estCorrecte = resultat && resultat.bonneReponse === i;
          const doitEstomper = etat === "feedback" && !estChoisi && !estCorrecte;

          return (
            <button
              key={c.lettre}
              type="button"
              disabled={etat === "feedback"}
              onClick={() => onRepondre(i)}
              className={`flex min-h-[64px] items-center gap-3 rounded-2xl px-5 py-4 text-left text-white shadow-lg transition-all ${c.classe} ${
                doitEstomper ? "opacity-30" : ""
              } ${
                etat === "feedback" && estCorrecte
                  ? "ring-4 ring-white scale-[1.02]"
                  : etat === "feedback" && estChoisi && !estCorrecte
                    ? "ring-4 ring-white/60"
                    : ""
              }`}
            >
              <Icone className="h-6 w-6 shrink-0 fill-current" />
              <span className="text-base font-semibold sm:text-lg">{choixTextes[i]}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {etat === "feedback" && resultat && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mx-auto mb-2 flex items-center gap-3 rounded-2xl px-6 py-3 text-center font-bold ${
              resultat.correct
                ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40"
                : "bg-red-500/15 text-red-300 ring-1 ring-red-500/40"
            }`}
          >
            {resultat.correct ? (
              <span>
                Bonne réponse ! +{resultat.pointsObtenus} points
                {resultat.multiplicateur > 1 ? ` (série ×${resultat.multiplicateur})` : ""}
              </span>
            ) : (
              <span>
                {reponseChoisie === null ? "Temps écoulé !" : "Mauvaise réponse."} La bonne réponse était{" "}
                {CHOIX[resultat.bonneReponse].lettre}.
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Palier visuel de la série : plus le multiplicateur monte, plus l'effet
// (couleur, nombre de flammes, vitesse de pulsation) s'intensifie.
function SerieBadge({ serie, multiplicateur }: { serie: number; multiplicateur: number }) {
  const palier = serie >= 8 ? 3 : serie >= 5 ? 2 : serie >= 3 ? 1 : 0;
  const couleurs = [
    "bg-space-surface2/70 text-ink-secondary ring-1 ring-space-border",
    "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
    "bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/40",
    "bg-red-500/20 text-red-300 ring-1 ring-red-500/50 shadow-glow-soft",
  ][palier];
  const echelle = [1, 1.05, 1.1, 1.16][palier];
  const duree = [0, 0.9, 0.7, 0.5][palier];

  return (
    <motion.span
      initial={{ scale: 0.85, opacity: 0 }}
      animate={
        palier === 0
          ? { scale: 1, opacity: 1 }
          : { scale: [1, echelle, 1], opacity: 1 }
      }
      transition={
        palier === 0
          ? { duration: 0.2 }
          : { duration: duree, repeat: Infinity, ease: "easeInOut" }
      }
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${couleurs}`}
    >
      Série : {serie}
      {Array.from({ length: palier }).map((_, i) => (
        <Flame key={i} className="h-4 w-4 fill-current" />
      ))}
      {multiplicateur > 1 && <span className="text-xs font-semibold opacity-80">×{multiplicateur}</span>}
    </motion.span>
  );
}

function EcranResultats({
  titre,
  score,
  bonnesReponses,
  totalQuestions,
  serieMax,
  classement,
  onRejouer,
}: {
  titre: string;
  score: number;
  bonnesReponses: number;
  totalQuestions: number;
  serieMax: number;
  classement: import("@/lib/quiz").ClassementQuiz | null;
  onRejouer: () => void;
}) {
  const top3 = classement?.classement.slice(0, 3) ?? [];
  const position = classement?.positionEleve ?? null;
  const MEDAILLES = [
    { icone: Crown, classe: "text-amber-400" },
    { icone: Medal, classe: "text-slate-300" },
    { icone: Medal, classe: "text-amber-700" },
  ];

  return (
    <div className="flex h-full flex-col items-center overflow-y-auto p-6">
      <div className="flex w-full max-w-2xl flex-col items-center gap-6 py-6">
        <div className="text-center">
          <p className="eyebrow">{titre}</p>
          <h2 className="page-title">Résultats</h2>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="card flex flex-col items-center gap-1 px-8 py-5">
            <span className="text-3xl font-black text-neon-violet">{score}</span>
            <span className="text-xs uppercase tracking-widest text-ink-muted">Points</span>
          </div>
          <div className="card flex flex-col items-center gap-1 px-8 py-5">
            <span className="text-3xl font-black text-emerald-400">
              {bonnesReponses}/{totalQuestions}
            </span>
            <span className="text-xs uppercase tracking-widest text-ink-muted">Bonnes réponses</span>
          </div>
          {serieMax >= 3 && (
            <div className="card flex flex-col items-center gap-1 px-8 py-5">
              <span className="flex items-center gap-1 text-3xl font-black text-amber-400">
                {serieMax}
                <Flame className="h-6 w-6 fill-current" />
              </span>
              <span className="text-xs uppercase tracking-widest text-ink-muted">Meilleure série</span>
            </div>
          )}
        </div>

        {top3.length > 0 && (
          <div className="w-full">
            <h3 className="section-title mb-3 text-center">Classement de la classe</h3>
            <div className="flex items-end justify-center gap-3">
              {[top3[1], top3[0], top3[2]].map((ligne, i) =>
                ligne ? (
                  <div
                    key={ligne.eleveId}
                    className={`flex flex-col items-center gap-1 rounded-2xl border border-space-border bg-space-surface2/60 px-4 py-3 ${
                      i === 1 ? "pb-6" : "pb-3"
                    }`}
                    style={{ order: i === 1 ? 0 : i }}
                  >
                    {(() => {
                      const M = MEDAILLES[ligne.rang - 1].icone;
                      return <M className={`h-5 w-5 ${MEDAILLES[ligne.rang - 1].classe}`} />;
                    })()}
                    <span className="max-w-[7rem] truncate text-sm font-medium text-ink-primary">
                      {ligne.nom}
                    </span>
                    <span className="text-xs text-ink-muted">{ligne.score} pts</span>
                  </div>
                ) : (
                  <div key={`vide-${i}`} />
                )
              )}
            </div>

            {position && position.rang > 3 && (
              <p className="mt-4 text-center text-sm text-ink-secondary">
                Ta position : <span className="font-bold text-neon-cyan">#{position.rang}</span> avec{" "}
                {position.score} points
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Link href="/eleve/quiz" className="btn-secondary">
            Retour aux quiz
          </Link>
          <button type="button" onClick={onRejouer} className="btn-primary">
            Rejouer
          </button>
        </div>
      </div>
    </div>
  );
}
