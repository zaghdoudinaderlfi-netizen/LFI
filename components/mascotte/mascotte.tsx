"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  categorieParHeure,
  obtenirMessage,
  type CategorieMessage,
} from "@/lib/mascotte-messages";

type Etat = "actif" | "endormi" | "rebond";

const DELAI_SOMMEIL_MS  = 60_000;  // 60 s d'inactivité → dort
const DELAI_BULLE_MS    = 9_000;   // bulle visible 9 s
const DELAI_ROTATION_MS = 50_000;  // rotation motivation/conseil toutes les 50 s

const CATEGORIES_ROTATION: CategorieMessage[] = ["motivation", "conseil"];

// ── Variantes Framer Motion ───────────────────────────────────────────────────

const variantesAvatar = {
  actif: {
    y:       [0, -7, 0],
    rotate:  0,
    scale:   [1, 1.025, 1],
    opacity: 1,
    transition: {
      y:       { duration: 3, repeat: Infinity, ease: "easeInOut" as const },
      scale:   { duration: 3, repeat: Infinity, ease: "easeInOut" as const },
      rotate:  { duration: 0.45, ease: "easeOut" as const },
      opacity: { duration: 0.35 },
    },
  },
  endormi: {
    y:       [0, -2, 0],
    rotate:  18,           // penché — comme s'endormir sur son bureau
    scale:   [1, 1.01, 1],
    opacity: 0.62,
    transition: {
      y:       { duration: 5, repeat: Infinity, ease: "easeInOut" as const },
      scale:   { duration: 5, repeat: Infinity, ease: "easeInOut" as const },
      rotate:  { duration: 0.9, ease: "easeOut" as const },
      opacity: { duration: 0.5 },
    },
  },
  rebond: {
    y:       [0, -28, 6, -16, 3, 0],
    rotate:  [0, -7, 8, -4, 0],
    scale:   [1, 1.22, 0.87, 1.12, 0.97, 1],
    opacity: 1,
    transition: { duration: 0.72, ease: "easeOut" as const },
  },
};

const variantesBulle = {
  initial: { opacity: 0, scale: 0.82, x: -8 },
  animate: {
    opacity: 1, scale: 1, x: 0,
    transition: { type: "spring" as const, stiffness: 320, damping: 24 },
  },
  exit: {
    opacity: 0, scale: 0.9, x: -6,
    transition: { duration: 0.2 },
  },
};

// ── Composant ─────────────────────────────────────────────────────────────────

export function Mascotte({
  svgAvatar,
  prenom,
}: {
  svgAvatar: string;
  prenom?: string | null;
}) {
  const [etat, setEtatState] = useState<Etat>("actif");
  const [message, setMessage] = useState<string | null>(null);
  const [bulleId, setBulleId] = useState(0);
  const [montrerBulle, setMontrerBulle] = useState(false);

  const etatRef       = useRef<Etat>("actif");
  const timerSommeil  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerBulle    = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    obtenirMessage(categorieParHeure()).then((texte) => afficherBulle(texte));
    resetTimerSommeil();

    const intervalRotation = setInterval(async () => {
      if (etatRef.current === "endormi") return;
      const cats = CATEGORIES_ROTATION;
      const cat = cats[indexRotation.current % cats.length];
      indexRotation.current++;
      const texte = await obtenirMessage(cat);
      afficherBulle(texte);
    }, DELAI_ROTATION_MS);

    try {
      const pending = sessionStorage.getItem("mascotte:pending");
      if (pending) {
        sessionStorage.removeItem("mascotte:pending");
        const { texte } = JSON.parse(pending) as { texte?: string };
        if (texte) setTimeout(() => { setEtat("rebond"); afficherBulle(texte); }, 900);
      }
    } catch {
      // sessionStorage non disponible (guard SSR)
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

  // ── Événement externe : encouragement ────────────────────────────────────

  useEffect(() => {
    const handler = (e: Event) => {
      const texte = (e as CustomEvent<{ texte?: string }>).detail?.texte;
      if (texte) {
        setEtat("rebond"); // rebond joyeux !
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
          animate={etat}
          variants={variantesAvatar}
          style={{ originX: "50%", originY: "80%" }}
          onAnimationComplete={(def) => {
            // Après le rebond, retour à l'état actif (floating doux)
            if (def === "rebond") setEtat("actif");
          }}
        >
          <div
            className="h-24 w-24 overflow-hidden rounded-full ring-2 ring-neon-cyan/40 shadow-glow-cyan"
            dangerouslySetInnerHTML={{ __html: svgAvatar }}
          />
        </motion.div>

        {/* Zzz flottants quand endormi */}
        <AnimatePresence>
          {etat === "endormi" && (
            <>
              {(
                [
                  { delay: 0,   size: 10, dx: 22, dy: -28 },
                  { delay: 0.7, size: 13, dx: 32, dy: -46 },
                  { delay: 1.4, size: 16, dx: 24, dy: -64 },
                ] as const
              ).map(({ delay, size, dx, dy }, i) => (
                <motion.span
                  key={i}
                  className="absolute top-1 right-0 font-bold text-neon-cyan pointer-events-none select-none"
                  style={{ fontSize: size }}
                  initial={{ opacity: 0, x: 16, y: 0 }}
                  animate={{ opacity: [0, 1, 1, 0], x: [16, dx], y: [0, dy] }}
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
            <div className="rounded-2xl rounded-bl-sm border border-space-border bg-space-surface2 px-4 py-2.5 shadow-md">
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
