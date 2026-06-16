"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  categorieParHeure,
  obtenirMessage,
  type CategorieMessage,
} from "@/lib/mascotte-messages";

type Etat = "actif" | "endormi";

const DELAI_SOMMEIL_MS = 60_000;   // 60 s d'inactivité → dort
const DELAI_BULLE_MS  = 9_000;    // chaque bulle s'affiche 9 s
const DELAI_ROTATION_MS = 50_000; // rotation motivation/conseil toutes les 50 s

const CATEGORIES_ROTATION: CategorieMessage[] = ["motivation", "conseil"];

// Variantes Framer Motion ─────────────────────────────────────────────────────

const variantesAvatar = {
  actif: {
    y: [0, -7, 0],
    scale: [1, 1.025, 1],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const },
  },
  endormi: {
    y: [0, -2, 0],
    scale: [1, 1.01, 1],
    opacity: 0.65,
    transition: { duration: 5, repeat: Infinity, ease: "easeInOut" as const },
  },
};

const variantesBulle = {
  initial: { opacity: 0, scale: 0.82, x: -8 },
  animate: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 320, damping: 24 },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    x: -6,
    transition: { duration: 0.2 },
  },
};

// Composant principal ─────────────────────────────────────────────────────────

export function Mascotte({
  svgAvatar,
  prenom,
}: {
  svgAvatar: string;
  prenom?: string | null;
}) {
  const [etat, setEtatState] = useState<Etat>("actif");
  const [message, setMessage] = useState<string | null>(null);
  const [bulleId, setBulleId] = useState(0); // clé unique pour AnimatePresence
  const [montrerBulle, setMontrerBulle] = useState(false);

  const etatRef = useRef<Etat>("actif");
  const timerSommeil = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerBulle   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indexRotation = useRef(0);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const setEtat = useCallback((e: Etat) => {
    etatRef.current = e;
    setEtatState(e);
  }, []);

  const afficherBulle = useCallback((texte: string, dureeMs = DELAI_BULLE_MS) => {
    setMessage(texte);
    setMontrerBulle(true);
    setBulleId((id) => id + 1);

    if (timerBulle.current) clearTimeout(timerBulle.current);
    // Les bulles de sommeil restent jusqu'au réveil
    if (dureeMs > 0) {
      timerBulle.current = setTimeout(() => setMontrerBulle(false), dureeMs);
    }
  }, []);

  const resetTimerSommeil = useCallback(() => {
    if (timerSommeil.current) clearTimeout(timerSommeil.current);
    timerSommeil.current = setTimeout(async () => {
      setEtat("endormi");
      const texte = await obtenirMessage("sommeil");
      afficherBulle(texte, 0); // reste jusqu'au réveil
    }, DELAI_SOMMEIL_MS);
  }, [setEtat, afficherBulle]);

  const reveiller = useCallback(async () => {
    resetTimerSommeil();
    if (etatRef.current !== "endormi") return;
    setEtat("actif");
    const texte = await obtenirMessage("reveil");
    afficherBulle(texte);
  }, [resetTimerSommeil, setEtat, afficherBulle]);

  // ── Montage ──────────────────────────────────────────────────────────────

  useEffect(() => {
    // Message de bienvenue
    const categorie = categorieParHeure();
    obtenirMessage(categorie).then((texte) => afficherBulle(texte));
    resetTimerSommeil();

    // Rotation motivation/conseil
    const intervalRotation = setInterval(async () => {
      if (etatRef.current === "endormi") return;
      const cats = CATEGORIES_ROTATION;
      const cat = cats[indexRotation.current % cats.length];
      indexRotation.current++;
      const texte = await obtenirMessage(cat);
      afficherBulle(texte);
    }, DELAI_ROTATION_MS);

    // Encouragement en attente (depuis une Server Action via sessionStorage)
    try {
      const pending = sessionStorage.getItem("mascotte:pending");
      if (pending) {
        sessionStorage.removeItem("mascotte:pending");
        const { texte } = JSON.parse(pending) as { texte?: string };
        if (texte) setTimeout(() => afficherBulle(texte), 900);
      }
    } catch {
      // sessionStorage non disponible (SSR guard)
    }

    return () => {
      clearInterval(intervalRotation);
      if (timerSommeil.current) clearTimeout(timerSommeil.current);
      if (timerBulle.current)   clearTimeout(timerBulle.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Listeners d'activité ─────────────────────────────────────────────────

  useEffect(() => {
    const onActivity = () => reveiller();
    const evts = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"] as const;
    evts.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    return () => evts.forEach((e) => window.removeEventListener(e, onActivity));
  }, [reveiller]);

  // ── Événement externe : encouragement depuis n'importe quel composant ─────

  useEffect(() => {
    const handler = (e: Event) => {
      const texte = (e as CustomEvent<{ texte?: string }>).detail?.texte;
      if (texte) {
        setEtat("actif");
        resetTimerSommeil();
        afficherBulle(texte);
      }
    };
    window.addEventListener("mascotte:encouragement", handler);
    return () => window.removeEventListener("mascotte:encouragement", handler);
  }, [setEtat, resetTimerSommeil, afficherBulle]);

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex items-end gap-3 sm:gap-5">
      {/* Avatar animé */}
      <div className="relative shrink-0">
        <motion.div
          animate={etat === "actif" ? variantesAvatar.actif : variantesAvatar.endormi}
        >
          <div
            className="h-20 w-20 sm:h-24 sm:w-24 overflow-hidden rounded-full ring-2 ring-neon-cyan/40 shadow-glow-cyan"
            dangerouslySetInnerHTML={{ __html: svgAvatar }}
          />
        </motion.div>

        {/* Zzz flottants quand endormi */}
        <AnimatePresence>
          {etat === "endormi" && (
            <>
              {([
                { delay: 0,   size: 10, dx: 20, dy: -28 },
                { delay: 0.7, size: 13, dx: 30, dy: -44 },
                { delay: 1.4, size: 16, dx: 22, dy: -62 },
              ] as const).map(({ delay, size, dx, dy }, i) => (
                <motion.span
                  key={i}
                  className="absolute top-1 right-0 font-bold text-neon-cyan pointer-events-none select-none"
                  style={{ fontSize: size }}
                  initial={{ opacity: 0, x: 16, y: 0 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    x: [16, dx],
                    y: [0, dy],
                  }}
                  transition={{
                    delay,
                    duration: 2.2,
                    repeat: Infinity,
                    repeatDelay: 1.8,
                    ease: "easeOut",
                  }}
                >
                  z
                </motion.span>
              ))}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Bulle de message */}
      <AnimatePresence mode="wait">
        {montrerBulle && message && (
          <motion.div
            key={bulleId}
            variants={variantesBulle}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative max-w-[220px] sm:max-w-xs"
          >
            {/* Fond de la bulle */}
            <div className="rounded-2xl rounded-bl-sm border border-space-border bg-space-surface2 px-4 py-2.5 shadow-md">
              {/* Queue (triangle) */}
              <span
                aria-hidden
                className="absolute -left-[7px] bottom-3 h-3.5 w-3.5 rotate-45 rounded-sm border-b border-l border-space-border bg-space-surface2"
              />
              <p className="relative z-10 text-sm font-medium leading-snug text-ink-primary">
                {message}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
